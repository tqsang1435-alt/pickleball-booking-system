"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getMyBookings, cancelBooking } from "@/services/bookingApi";
import type { Booking, BookingStatus, CancelResult } from "@/services/bookingApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import CancelBookingModal from "./CancelBookingModal";
import RefundRequestModal from "./RefundRequestModal"; // Force recompile
import PaymentModal from "@/modules/payments/PaymentModal";
import ReviewModal from "@/components/reviews/ReviewModal";
import styles from "./BookingHistoryPage.module.css";

// ===== Helpers =====

const STATUS_LABELS: Record<string, string> = {
  PendingPayment: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  Confirmed: "Đã xác nhận",
  CheckedIn: "Đã Check-in",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
  Refunded: "Đã hoàn tiền",
  NoShow: "Vắng mặt",
};

const REFUND_STATUS_LABELS: Record<string, string> = {
  Requested: "Đang chờ hoàn tiền",
  Processing: "Đang xử lý hoàn tiền",
  PendingManual: "Chờ hoàn tiền thủ công",
  Completed: "Đã hoàn tiền",
  Rejected: "Từ chối hoàn tiền",
};

const TYPE_LABELS: Record<string, string> = {
  Court: "Đặt sân",
  Coach: "Đặt HLV",
  Combo: "Combo",
};

function getStatusClass(status: string): string {
  switch (status) {
    case "PendingPayment": return styles.statusPending;
    case "Confirmed": case "Paid": return styles.statusConfirmed;
    case "CheckedIn": return styles.statusCheckedIn;
    case "Completed": return styles.statusCompleted;
    case "Cancelled": case "NoShow": return styles.statusCancelled;
    case "Refunded": return styles.statusRefunded;
    default: return styles.statusDefault;
  }
}

// Countdown timer cho booking PendingPayment
function useCountdown(booking: Booking) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (booking.Status !== "PendingPayment" || !booking.PaymentDeadline) return;

    const expiresAt = new Date(booking.PaymentDeadline);

    function tick() {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking.BookingID, booking.Status, booking.PaymentDeadline]);

  return secondsLeft;
}

function CountdownBadge({ booking }: { booking: Booking }) {
  const seconds = useCountdown(booking);

  if (booking.Status !== "PendingPayment" || seconds === null) return null;

  if (seconds <= 0) {
    return <div className={styles.expiredBadge}>⏰ Hết hạn thanh toán</div>;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 120; // < 2 phút

  return (
    <div className={`${styles.countdownBadge} ${isUrgent ? styles.countdownUrgent : ""}`}>
      Còn {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}

function ActionCell({ booking, setCancelTarget }: { booking: Booking; setCancelTarget: (b: Booking) => void }) {
  const seconds = useCountdown(booking);
  
  const isExpired = booking.Status === "PendingPayment" && seconds !== null && seconds <= 0;
  const isPending = booking.Status === "PendingPayment" && !isExpired;
  
  const canCancel = ["PendingPayment", "Confirmed"].includes(booking.Status);

  return (
    <div className={styles.actionCell}>
      {isPending && (
        <a href="/profile" className={styles.btnPay} style={{textDecoration: "none"}}>
          Thanh toán
        </a>
      )}
      {canCancel && !isExpired && (
        <button
          className={styles.btnCancel}
          onClick={() => setCancelTarget(booking)}
        >
          Hủy
        </button>
      )}
      {!isPending && (!canCancel || isExpired) && <span className={styles.noAction}>-</span>}
    </div>
  );
}

// ===== Main Component =====

type FilterStatus = "all" | BookingStatus;
type FilterType = "all" | "Court" | "Coach" | "Combo";

function BookingDetailModal({ booking, onClose, onReview, onPay, onRefund }: {
  booking: Booking;
  onClose: () => void;
  onReview: () => void;
  onPay: () => void;
  onRefund: () => void;
}) {
  const isPending = booking.Status === "PendingPayment";
  const bookingDateStr = booking.BookingDate.toString().split("T")[0];
  const startDateTime = new Date(`${bookingDateStr}T${booking.StartTime}:00`);
  const isPast = Date.now() >= startDateTime.getTime();

  // Expiry deadline calculation
  const expiresAt = booking.PaymentDeadline
    ? new Date(booking.PaymentDeadline)
    : new Date(new Date(booking.CreatedAt).getTime() + 10 * 60 * 1000);
  const isExpired = isPending && Date.now() >= expiresAt.getTime();

  const timelineSteps = [
    { label: "Đặt sân thành công", done: true, time: new Date(booking.CreatedAt).toLocaleString("vi-VN") },
    { 
      label: "Thanh toán", 
      done: booking.Status !== "PendingPayment" && booking.Status !== "Cancelled", 
      time: booking.PaidAt ? new Date(booking.PaidAt).toLocaleString("vi-VN") : null 
    },
    { 
      label: "Đã xác nhận", 
      done: ["Confirmed", "CheckedIn", "Completed"].includes(booking.Status)
    },
    { 
      label: "Check-in", 
      done: ["CheckedIn", "Completed"].includes(booking.Status), 
      time: booking.CheckInTime ? new Date(booking.CheckInTime).toLocaleString("vi-VN") : null 
    },
    { 
      label: booking.Status === "Cancelled" || booking.Status === "Refunded" || booking.Status === "NoShow" ? "Đã hủy/Vắng mặt" : "Hoàn thành", 
      done: ["Completed", "Cancelled", "Refunded", "NoShow"].includes(booking.Status), 
      alert: ["Cancelled", "Refunded", "NoShow"].includes(booking.Status) 
    }
  ];

  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.detailModalHeader}>
          <div>
            <span className={styles.detailModalLabel}>CHI TIẾT ĐƠN ĐẶT</span>
            <h3>Mã: {booking.BookingCode}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.detailModalBody}>
          {/* Status Timeline */}
          <div className={styles.timelineContainer}>
            <h4 className={styles.subTitle}>Tiến trình đơn đặt</h4>
            <div className={styles.timeline}>
              {timelineSteps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.timelineStep} ${step.done ? styles.stepDone : ""} ${step.alert ? styles.stepAlert : ""}`}
                >
                  <div className={styles.stepIndicator}>
                    {step.alert ? "✕" : step.done ? "✓" : idx + 1}
                  </div>
                  <div className={styles.stepContent}>
                    <strong>{step.label}</strong>
                    {step.time && <span className={styles.stepTime}>{step.time}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.detailGrid}>
            {/* Left: General info */}
            <div className={styles.infoCol}>
              <h4 className={styles.subTitle}>Thông tin dịch vụ</h4>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Loại dịch vụ:</span>
                <span className={styles.infoValue}>
                  {booking.BookingType === "Court" ? "Đặt sân" : booking.BookingType === "Coach" ? "Đặt HLV" : "Combo sân + HLV"}
                </span>
              </div>

              {booking.CourtName && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Sân chơi:</span>
                  <span className={styles.infoValue}>{booking.CourtName}</span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Địa chỉ:</span>
                <span className={styles.infoValue}>
                  {booking.Location || "Khu đô thị Han River, Sơn Trà, Đà Nẵng"}
                </span>
              </div>

              {booking.CoachName && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Huấn luyện viên:</span>
                  <span className={styles.infoValue}>{booking.CoachName}</span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thời gian chơi:</span>
                <span className={styles.infoValue}>
                  {booking.StartTime} - {booking.EndTime} ngày {new Date(booking.BookingDate).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Ngày khởi tạo:</span>
                <span className={styles.infoValue}>
                  {new Date(booking.CreatedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Right: Payment details */}
            <div className={styles.paymentCol}>
              <h4 className={styles.subTitle}>Thông tin thanh toán</h4>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Trạng thái đơn:</span>
                <span className={`${styles.badge} ${styles["badge" + booking.Status] || ""}`}>
                  {STATUS_LABELS[booking.Status] || booking.Status}
                </span>
              </div>

              {booking.RefundStatus && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Hoàn tiền:</span>
                  <span className={styles.verifiedBadge}>
                    {REFUND_STATUS_LABELS[booking.RefundStatus] || booking.RefundStatus}
                  </span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phương thức:</span>
                <span className={styles.infoValue}>{booking.PaymentMethod || "Chưa xác định"}</span>
              </div>

              {booking.TransactionCode && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Mã giao dịch:</span>
                  <span className={styles.infoValue}>{booking.TransactionCode}</span>
                </div>
              )}

              <div className={styles.invoiceBox}>
                <div className={styles.invoiceHeader}>
                  <span>HÓA ĐƠN CHI TIẾT</span>
                </div>
                <div className={styles.invoiceRow}>
                  <span>Giá thuê sân:</span>
                  <span>{formatCurrency(Number(booking.CourtFee || 0))}</span>
                </div>
                {booking.CoachFee > 0 && (
                  <div className={styles.invoiceRow}>
                    <span>Học phí Coach:</span>
                    <span>{formatCurrency(Number(booking.CoachFee))}</span>
                  </div>
                )}
                {booking.DiscountAmount > 0 && (
                  <div className={styles.invoiceRow} style={{ color: "#d32f2f" }}>
                    <span>Giảm giá (Voucher):</span>
                    <span>-{formatCurrency(Number(booking.DiscountAmount))}</span>
                  </div>
                )}
                <div className={styles.invoiceDivider} />
                <div className={styles.invoiceTotal}>
                  <span>Tổng tiền:</span>
                  <span>{formatCurrency(Number(booking.TotalAmount))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.detailModalFooter}>
          {isPending && !isExpired && (
            <button className={styles.btnPay} onClick={onPay}>Thanh toán ngay</button>
          )}
          {["Confirmed", "Paid"].includes(booking.Status) && !isPast && (
            <button className={styles.btnCancel} onClick={onRefund}>Yêu cầu hoàn tiền</button>
          )}
          {booking.Status === "Completed" && !booking.IsReviewed && (
            <button className={styles.btnReview} onClick={onReview}>Đánh giá dịch vụ</button>
          )}
          <button className={styles.btnSec} onClick={onClose}>Đóng lại</button>
        </div>
      </div>
    </div>
  );
}

export default function BookingHistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  // Active Tab Filter
  const [activeTab, setActiveTab] = useState<"all" | "PendingPayment" | "Upcoming" | "Completed" | "Cancelled">("all");

  // Selected Booking for Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Modals targets
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);
  const [payTarget, setPayTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await getMyBookings(token);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Không tải được lịch sử booking.");
    } finally {
      setLoading(false);
    }
  }

  // Apply filters
  const filtered = useMemo(() => {
    let result = [...bookings];

    if (activeTab === "PendingPayment") {
      result = result.filter((b) => b.Status === "PendingPayment");
    } else if (activeTab === "Upcoming") {
      result = result.filter((b) => ["Confirmed", "Paid", "CheckedIn"].includes(b.Status));
    } else if (activeTab === "Completed") {
      result = result.filter((b) => b.Status === "Completed");
    } else if (activeTab === "Cancelled") {
      result = result.filter((b) => ["Cancelled", "Refunded", "NoShow"].includes(b.Status));
    }

    if (filterType !== "all") {
      result = result.filter((b) => b.BookingType === filterType);
    }
    if (filterDateFrom) {
      result = result.filter((b) => b.BookingDate >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter((b) => b.BookingDate <= filterDateTo);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((b) =>
        b.BookingCode.toLowerCase().includes(q) ||
        (b.CourtName || "").toLowerCase().includes(q) ||
        (b.CoachName || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [bookings, activeTab, filterType, filterDateFrom, filterDateTo, searchText]);

  // Stats
  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((b) => b.Status === "PendingPayment").length,
    active: bookings.filter((b) => ["Confirmed", "CheckedIn"].includes(b.Status)).length,
    completed: bookings.filter((b) => b.Status === "Completed").length,
    totalSpent: bookings
      .filter((b) => ["Confirmed", "CheckedIn", "Completed"].includes(b.Status))
      .reduce((sum, b) => sum + Number(b.TotalAmount), 0),
  }), [bookings]);

  // Paginate
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCancelSuccess(result: CancelResult) {
    setCancelTarget(null);
    setSuccess("Hủy booking thành công.");
    loadBookings();
    setTimeout(() => setSuccess(""), 6000);
  }

  function handleRefundSuccess(message: string) {
    setRefundTarget(null);
    setSuccess(message);
    loadBookings();
    setTimeout(() => setSuccess(""), 6000);
  }

  function handleReviewSuccess() {
    setReviewTarget(null);
    setSuccess("Cảm ơn bạn đã đánh giá!");
    loadBookings();
    setTimeout(() => setSuccess(""), 6000);
  }

  function resetFilters() {
    setActiveTab("all");
    setFilterType("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchText("");
    setPage(1);
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Đang tải lịch sử booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Cancel Modal */}
        {cancelTarget && (
          <CancelBookingModal
            booking={cancelTarget}
            onClose={() => setCancelTarget(null)}
            onSuccess={handleCancelSuccess}
          />
        )}

        {/* Refund Modal */}
        {refundTarget && (
          <RefundRequestModal
            booking={refundTarget}
            onClose={() => setRefundTarget(null)}
            onSuccess={handleRefundSuccess}
          />
        )}

        {/* Payment Modal */}
        {payTarget && (
          <PaymentModal
            bookingId={payTarget.BookingID}
            bookingCode={payTarget.BookingCode}
            totalAmount={Number(payTarget.TotalAmount)}
            onClose={() => {
              setPayTarget(null);
              loadBookings();
            }}
          />
        )}

        {/* Review Modal */}
        {reviewTarget && (
          <ReviewModal
            isOpen={true}
            onClose={() => setReviewTarget(null)}
            bookingId={reviewTarget.BookingID}
            title={reviewTarget.BookingType === "Court" ? "Đánh giá Sân" : reviewTarget.BookingType === "Coach" ? "Đánh giá HLV" : "Đánh giá Combo"}
            onSuccess={handleReviewSuccess}
          />
        )}

        {/* Detail Modal/Drawer */}
        {selectedBooking && (
          <BookingDetailModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onPay={() => {
              setPayTarget(selectedBooking);
              setSelectedBooking(null);
            }}
            onRefund={() => {
              setRefundTarget(selectedBooking);
              setSelectedBooking(null);
            }}
            onReview={() => {
              setReviewTarget(selectedBooking);
              setSelectedBooking(null);
            }}
          />
        )}

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerLabel}>QUẢN LÝ LỊCH HẸN</span>
            <h1 className={styles.title}>Lịch sử Booking</h1>
            <p className={styles.headerDesc}>Quản lý và theo dõi các lịch đặt sân, huấn luyện viên và gói combo của bạn tại PickleClub.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.backBtn} onClick={() => router.push("/profile")}>
              ← Về hồ sơ
            </button>
            <button className={styles.newBookingBtn} onClick={() => router.push("/courts")}>
              Đặt lịch mới ➜
            </button>
          </div>
        </header>

        {/* Toast messages */}
        {success && <div className={styles.successToast}>{success}</div>}
        {error && <div className={styles.errorToast}>{error} <button onClick={loadBookings}>Thử lại</button></div>}

        {/* Stats cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardAccent} style={{ backgroundColor: "#00a86b" }} />
            <div className={styles.statCardHeader}>
              <span className={styles.statIcon}>📋</span>
              <span className={styles.statLabel}>Tổng booking</span>
            </div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
          
          <div className={`${styles.statCard} ${styles.statWarning}`}>
            <div className={styles.statCardAccent} style={{ backgroundColor: "#faad14" }} />
            <div className={styles.statCardHeader}>
              <span className={styles.statIcon}>⏳</span>
              <span className={styles.statLabel}>Chờ thanh toán</span>
            </div>
            <div className={styles.statValue}>{stats.pending}</div>
          </div>
          
          <div className={`${styles.statCard} ${styles.statSuccess}`}>
            <div className={styles.statCardAccent} style={{ backgroundColor: "#52c41a" }} />
            <div className={styles.statCardHeader}>
              <span className={styles.statIcon}>⚡</span>
              <span className={styles.statLabel}>Đang hoạt động</span>
            </div>
            <div className={styles.statValue}>{stats.active}</div>
          </div>
          
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statCardAccent} style={{ backgroundColor: "#1890ff" }} />
            <div className={styles.statCardHeader}>
              <span className={styles.statIcon}>✅</span>
              <span className={styles.statLabel}>Hoàn thành</span>
            </div>
            <div className={styles.statValue}>{stats.completed}</div>
          </div>
          
          <div className={`${styles.statCard} ${styles.statSpent}`}>
            <div className={styles.statCardAccent} style={{ backgroundColor: "#073b2b" }} />
            <div className={styles.statCardHeader}>
              <span className={styles.statIcon}>💰</span>
              <span className={styles.statLabel}>Tổng chi tiêu</span>
            </div>
            <div className={styles.statValue}>{formatCurrency(stats.totalSpent)}</div>
          </div>
        </div>

        {/* Toolbar & Quick Tabs */}
        <div className={styles.toolbarContainer}>
          {/* Status Tabs */}
          <div className={styles.statusTabs}>
            {[
              { key: "all", label: "Tất cả" },
              { key: "PendingPayment", label: "Chờ thanh toán" },
              { key: "Upcoming", label: "Sắp diễn ra" },
              { key: "Completed", label: "Hoàn thành" },
              { key: "Cancelled", label: "Đã hủy" }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ""}`}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          <div className={styles.filtersPanel}>
            <div className={styles.searchCol}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="🔍 Tìm theo mã booking, sân, HLV..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className={styles.selectsCol}>
              <select
                className={styles.filterSelect}
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value as FilterType); setPage(1); }}
              >
                <option value="all">Tất cả loại</option>
                <option value="Court">Đặt sân</option>
                <option value="Coach">Đặt HLV</option>
                <option value="Combo">Combo</option>
              </select>

              <div className={styles.dateRange}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                  placeholder="Từ ngày"
                />
                <span className={styles.dateSeparator}>→</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                  placeholder="Đến ngày"
                />
              </div>

              <button className={styles.resetBtn} onClick={resetFilters}>
                ↺ Xóa bộ lọc
              </button>
            </div>
          </div>

          <div className={styles.resultCount}>
            Hiển thị {filtered.length} / {bookings.length} booking
          </div>
        </div>

        {/* Booking list */}
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>Không có booking nào</h3>
            <p>Thử thay đổi bộ lọc hoặc <a href="/courts">đặt sân ngay</a></p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã Booking</th>
                    <th>Dịch vụ</th>
                    <th>Thời gian</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((booking) => {
                    const isPending = booking.Status === "PendingPayment";

                    // Calculate expiry using PaymentDeadline if available
                    const expiresAt = booking.PaymentDeadline
                      ? new Date(booking.PaymentDeadline)
                      : new Date(new Date(booking.CreatedAt).getTime() + 10 * 60 * 1000);
                    const isExpired = isPending && Date.now() >= expiresAt.getTime();

                    // Calculate if booking playtime is in the past
                    const bookingDateStr = booking.BookingDate.toString().split("T")[0];
                    const startDateTime = new Date(`${bookingDateStr}T${booking.StartTime}:00`);
                    const isPast = Date.now() >= startDateTime.getTime();

                    return (
                      <tr 
                        key={booking.BookingID} 
                        className={styles.clickableRow}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <td data-label="Mã Booking">
                          <div className={styles.bookingCode}>{booking.BookingCode}</div>
                          <div className={styles.bookingDate}>
                            Đặt ngày: {new Date(booking.CreatedAt).toLocaleDateString("vi-VN")}
                          </div>
                        </td>
                        <td data-label="Dịch vụ">
                          <div className={styles.serviceType}>
                            {TYPE_LABELS[booking.BookingType] || booking.BookingType}
                          </div>
                          {booking.CourtName && <div className={styles.serviceDetail}>Sân: {booking.CourtName}</div>}
                          {booking.CoachName && <div className={styles.serviceDetail}>HLV: {booking.CoachName}</div>}
                        </td>
                        <td data-label="Thời gian">
                          <div className={styles.playDate}>
                            {new Date(booking.BookingDate).toLocaleDateString("vi-VN")}
                          </div>
                          <div className={styles.playTime}>
                            {booking.StartTime} - {booking.EndTime}
                          </div>
                        </td>
                        <td data-label="Tổng tiền">
                          <div className={styles.amount}>{formatCurrency(Number(booking.TotalAmount))}</div>
                          {booking.PaymentMethod && (
                            <div className={styles.paymentMethod}>{booking.PaymentMethod}</div>
                          )}
                        </td>
                        <td data-label="Trạng thái">
                          <div className={styles.statusCol}>
                            <span className={`${styles.badge} ${styles["badge" + booking.Status] || ""}`}>
                              {STATUS_LABELS[booking.Status] || booking.Status}
                            </span>
                            {booking.RefundStatus && (
                              <span className={`${styles.badge} ${booking.RefundStatus === 'Completed' ? styles.badgeConfirmed : booking.RefundStatus === 'Rejected' ? styles.badgeCancelled : styles.badgePendingPayment}`}>
                                {REFUND_STATUS_LABELS[booking.RefundStatus] || booking.RefundStatus}
                              </span>
                            )}
                            <CountdownBadge booking={booking} />
                          </div>
                        </td>
                        <td data-label="Hành động" onClick={(e) => e.stopPropagation()}>
                          <div className={styles.actionCell}>
                            {isPending && !isExpired && (
                              <>
                                <button
                                  className={styles.btnPay}
                                  onClick={() => setPayTarget(booking)}
                                  title="Thanh toán booking này"
                                >
                                  Thanh toán
                                </button>
                                <button
                                  className={styles.btnCancel}
                                  onClick={() => setCancelTarget(booking)}
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                            {["Confirmed", "Paid", "CheckedIn"].includes(booking.Status) && !isPast && (
                              <>
                                <button
                                  className={styles.btnSec}
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  Xem chi tiết
                                </button>
                                <button
                                  className={`${styles.btnCancel} ${styles.btnCancelRefund}`}
                                  onClick={() => setRefundTarget(booking)}
                                >
                                  Hoàn tiền
                                </button>
                              </>
                            )}
                            {booking.Status === "Completed" && !booking.IsReviewed && (
                              <button
                                  className={styles.btnPay}
                                  onClick={() => setReviewTarget(booking)}
                                  style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", color: "white" }}
                              >
                                Đánh giá
                              </button>
                            )}
                            {booking.Status === "Completed" && booking.IsReviewed && (
                              <span className={styles.noActionText}>Đã đánh giá</span>
                            )}
                            {((!isPending || isExpired) && !((["Confirmed", "Paid"].includes(booking.Status) && !isPast)) && booking.Status !== "Completed") && (
                              <button
                                className={styles.btnRebook}
                                onClick={() => router.push("/courts")}
                              >
                                Đặt lại
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Shown via CSS media queries) */}
            <div className={styles.mobileCardsList}>
              {paginated.map((booking) => {
                const isPending = booking.Status === "PendingPayment";

                const expiresAt = booking.PaymentDeadline
                  ? new Date(booking.PaymentDeadline)
                  : new Date(new Date(booking.CreatedAt).getTime() + 10 * 60 * 1000);
                const isExpired = isPending && Date.now() >= expiresAt.getTime();

                const bookingDateStr = booking.BookingDate.toString().split("T")[0];
                const startDateTime = new Date(`${bookingDateStr}T${booking.StartTime}:00`);
                const isPast = Date.now() >= startDateTime.getTime();

                return (
                  <div 
                    key={booking.BookingID} 
                    className={styles.mobileCard}
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className={styles.mobileCardHeader}>
                      <span className={styles.mobileBookingCode}>{booking.BookingCode}</span>
                      <span className={`${styles.badge} ${styles["badge" + booking.Status] || ""}`}>
                        {STATUS_LABELS[booking.Status] || booking.Status}
                      </span>
                    </div>
                    
                    <div className={styles.mobileCardBody}>
                      <div className={styles.mobileCardRow}>
                        <strong>Loại dịch vụ:</strong>
                        <span>{TYPE_LABELS[booking.BookingType] || booking.BookingType}</span>
                      </div>
                      {booking.CourtName && (
                        <div className={styles.mobileCardRow}>
                          <strong>Sân:</strong>
                          <span>{booking.CourtName}</span>
                        </div>
                      )}
                      {booking.CoachName && (
                        <div className={styles.mobileCardRow}>
                          <strong>HLV:</strong>
                          <span>{booking.CoachName}</span>
                        </div>
                      )}
                      <div className={styles.mobileCardRow}>
                        <strong>Thời gian:</strong>
                        <span>
                          {booking.StartTime} - {booking.EndTime} ({new Date(booking.BookingDate).toLocaleDateString("vi-VN")})
                        </span>
                      </div>
                      <div className={styles.mobileCardRow}>
                        <strong>Tổng chi phí:</strong>
                        <span className={styles.amount}>{formatCurrency(Number(booking.TotalAmount))}</span>
                      </div>
                    </div>

                    <div className={styles.mobileCardActions} onClick={(e) => e.stopPropagation()}>
                      {isPending && !isExpired && (
                        <>
                          <button className={styles.btnPay} onClick={() => setPayTarget(booking)}>Thanh toán</button>
                          <button className={styles.btnCancel} onClick={() => setCancelTarget(booking)}>Hủy</button>
                        </>
                      )}
                      {["Confirmed", "Paid", "CheckedIn"].includes(booking.Status) && !isPast && (
                        <>
                          <button className={styles.btnSec} onClick={() => setSelectedBooking(booking)}>Chi tiết</button>
                          <button className={styles.btnCancel} onClick={() => setRefundTarget(booking)}>Hoàn tiền</button>
                        </>
                      )}
                      {booking.Status === "Completed" && !booking.IsReviewed && (
                        <button className={styles.btnPay} onClick={() => setReviewTarget(booking)} style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", color: "white" }}>
                          Đánh giá
                        </button>
                      )}
                      {booking.Status === "Completed" && booking.IsReviewed && (
                        <span className={styles.noActionText}>Đã đánh giá</span>
                      )}
                      {((!isPending || isExpired) && !((["Confirmed", "Paid"].includes(booking.Status) && !isPast)) && booking.Status !== "Completed") && (
                        <button className={styles.btnRebook} onClick={() => router.push("/courts")}>Đặt lại</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}

                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
