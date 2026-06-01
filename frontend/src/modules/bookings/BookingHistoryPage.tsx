"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getMyBookings, cancelBooking } from "@/services/bookingApi";
import type { Booking, BookingStatus, CancelResult } from "@/services/bookingApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import CancelBookingModal from "./CancelBookingModal";
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

const TYPE_LABELS: Record<string, string> = {
  Court: "🏟️ Đặt sân",
  Coach: "👨‍🏫 Đặt HLV",
  Combo: "🔥 Combo",
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

// Countdown timer cho booking PendingPayment (10 phút hold - BR-25)
function useCountdown(booking: Booking) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (booking.Status !== "PendingPayment") return;

    // Estimate hold expiry từ CreatedAt + 10 phút (BR-25)
    const createdAt = new Date(booking.CreatedAt);
    const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);

    function tick() {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking.BookingID, booking.Status, booking.CreatedAt]);

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
      ⏱️ Còn {mins}:{secs.toString().padStart(2, "0")} để thanh toán
    </div>
  );
}

// ===== Main Component =====

type FilterStatus = "all" | BookingStatus;
type FilterType = "all" | "Court" | "Coach" | "Combo";

export default function BookingHistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

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

    if (filterStatus !== "all") {
      result = result.filter((b) => b.Status === filterStatus);
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
  }, [bookings, filterStatus, filterType, filterDateFrom, filterDateTo, searchText]);

  // Stats
  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((b) => b.Status === "PendingPayment").length,
    active: bookings.filter((b) => ["Confirmed", "CheckedIn"].includes(b.Status)).length,
    completed: bookings.filter((b) => b.Status === "Completed").length,
    cancelled: bookings.filter((b) => ["Cancelled", "Refunded", "NoShow"].includes(b.Status)).length,
    totalSpent: bookings
      .filter((b) => ["Confirmed", "CheckedIn", "Completed"].includes(b.Status))
      .reduce((sum, b) => sum + Number(b.TotalAmount), 0),
  }), [bookings]);

  // Paginate
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCancelSuccess(result: CancelResult) {
    setCancelTarget(null);
    setSuccess(
      result.refundAmount > 0
        ? `Hủy thành công! Hoàn tiền ${formatCurrency(result.refundAmount)} (${result.refundPercent}%) trong 7 ngày làm việc.`
        : "Hủy booking thành công. Không có hoàn tiền (hủy trong 2 giờ)."
    );
    loadBookings();
    setTimeout(() => setSuccess(""), 6000);
  }

  function resetFilters() {
    setFilterStatus("all");
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

        {/* Header */}
        <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Lịch sử Booking</h1>
        </div>
        <button className={styles.backBtn} onClick={() => router.push("/profile")}>
          ← Về hồ sơ
        </button>
      </header>

      {/* Toast messages */}
      {success && <div className={styles.successToast}>{success}</div>}
      {error && <div className={styles.errorToast}>{error} <button onClick={loadBookings}>Thử lại</button></div>}

      {/* Stats cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Tổng booking</div>
        </div>
        <div className={`${styles.statCard} ${styles.statWarning}`}>
          <div className={styles.statValue}>{stats.pending}</div>
          <div className={styles.statLabel}>Chờ thanh toán</div>
        </div>
        <div className={`${styles.statCard} ${styles.statSuccess}`}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Đang hoạt động</div>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <div className={styles.statValue}>{stats.completed}</div>
          <div className={styles.statLabel}>Hoàn thành</div>
        </div>
        <div className={`${styles.statCard} ${styles.statPurple}`}>
          <div className={styles.statValue}>{formatCurrency(stats.totalSpent)}</div>
          <div className={styles.statLabel}>Tổng chi tiêu</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersPanel}>
        <div className={styles.filterRow}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="🔍 Tìm theo mã booking, sân, HLV..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
          />
        </div>
        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as FilterStatus); setPage(1); }}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value as FilterType); setPage(1); }}
          >
            <option value="all">Tất cả loại</option>
            <option value="Court">🏟️ Đặt sân</option>
            <option value="Coach">👨‍🏫 Đặt HLV</option>
            <option value="Combo">🔥 Combo</option>
          </select>

          <div className={styles.dateRange}>
            <input
              type="date"
              className={styles.dateInput}
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
              placeholder="Từ ngày"
            />
            <span>→</span>
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
                  const canCancel = ["PendingPayment", "Confirmed"].includes(booking.Status);
                  const isPending = booking.Status === "PendingPayment";

                  return (
                    <tr key={booking.BookingID}>
                      <td>
                        <div className={styles.bookingCode}>{booking.BookingCode}</div>
                        <div className={styles.bookingDate}>
                          Đặt ngày: {new Date(booking.CreatedAt).toLocaleDateString("vi-VN", { timeZone: "UTC" })}
                        </div>
                      </td>
                      <td>
                        <div className={styles.serviceType}>
                          {TYPE_LABELS[booking.BookingType] || booking.BookingType}
                        </div>
                        {booking.CourtName && <div className={styles.serviceDetail}>Sân: {booking.CourtName}</div>}
                        {booking.CoachName && <div className={styles.serviceDetail}>HLV: {booking.CoachName}</div>}
                      </td>
                      <td>
                        <div className={styles.playDate}>
                          📅 {new Date(booking.BookingDate).toLocaleDateString("vi-VN", { timeZone: "UTC" })}
                        </div>
                        <div className={styles.playTime}>
                          ⏱️ {booking.StartTime} - {booking.EndTime}
                        </div>
                      </td>
                      <td>
                        <div className={styles.amount}>{formatCurrency(Number(booking.TotalAmount))}</div>
                        {booking.PaymentMethod && (
                          <div className={styles.paymentMethod}>💳 {booking.PaymentMethod}</div>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles["badge" + booking.Status] || ""}`}>
                          {STATUS_LABELS[booking.Status] || booking.Status}
                        </span>
                        {booking.CheckInTime && (
                          <div className={styles.checkInTime}>
                            Lúc {new Date(booking.CheckInTime).toLocaleTimeString("vi-VN", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                        <CountdownBadge booking={booking} />
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          {isPending && (
                            <a href="/profile" className={styles.btnPay} style={{textDecoration: "none"}}>
                              Thanh toán
                            </a>
                          )}
                          {canCancel && (
                            <button
                              className={styles.btnCancel}
                              onClick={() => setCancelTarget(booking)}
                            >
                              Hủy
                            </button>
                          )}
                          {!isPending && !canCancel && <span className={styles.noAction}>-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
