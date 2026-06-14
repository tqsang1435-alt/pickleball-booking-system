"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDailyBookings, checkInBooking, cancelBooking } from "@/services/bookingApi";
import type { DailyBooking } from "@/services/bookingApi";
import { getToken, getUser } from "@/utils/authStorage";
import StateBox from "@/components/common/StateBox";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./AdminBookingsPage.module.css";

// Dùng locale sv-SE để có format YYYY-MM-DD theo múi giờ VN
function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState<DailyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string>("Tất cả");

  // Verify Role and Fetch Data
  useEffect(() => {
    const userToken = getToken();
    const user = getUser();
    const role = String(
      user?.RoleName || user?.role || user?.roles?.[0] || ""
    ).toLowerCase();

    // Staff va Admin deu duoc xem trang nay
    if (!userToken || (!role.includes("admin") && !role.includes("staff"))) {
      router.push("/login");
      return;
    }

    setToken(userToken);
  }, [router]);

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token, date]);

  async function loadBookings(silent = false) {
    if (!token) return;
    try {
      if (!silent) setLoading(true);
      setError("");
      const data = await getDailyBookings(token, date);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách booking.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleCheckIn(bookingId: number) {
    if (!token) return;
    if (!window.confirm("Xác nhận khách đã đến check-in nhận sân/HLV?")) return;

    try {
      setActioningId(bookingId);
      await checkInBooking(token, bookingId);
      await loadBookings(true);
    } catch (err: any) {
      alert(err.message || "Check-in thất bại");
    } finally {
      setActioningId(null);
    }
  }

  async function handleCancel(bookingId: number) {
    if (!token) return;
    const reason = window.prompt("Nhập lý do hủy booking:");
    if (reason === null) return; // User clicked Cancel in prompt
    if (reason.trim() === "") {
      alert("Vui lòng nhập lý do hủy.");
      return;
    }

    try {
      setActioningId(bookingId);
      await cancelBooking(token, bookingId, reason);
      await loadBookings(true);
    } catch (err: any) {
      alert(err.message || "Hủy booking thất bại");
    } finally {
      setActioningId(null);
    }
  }

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      PendingPayment: "Chờ thanh toán",
      Paid: "Đã thanh toán",
      Confirmed: "Chờ check-in",
      CheckedIn: "Đang sử dụng sân",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
      Refunded: "Đã hoàn tiền",
      NoShow: "Vắng mặt",
    };
    return map[status] ?? status;
  }

  function getStatusClass(status: string) {
    if (status === "Paid") return styles.badgeSuccess;
    if (status === "Confirmed") return styles.badgeWarning;
    if (status === "CheckedIn") return styles.badgeCheckedIn;
    if (status === "Completed") return styles.badgeCompleted;
    if (status === "PendingPayment") return styles.badgeWarning;
    if (["Cancelled", "Refunded", "NoShow"].includes(status)) return styles.badgeError;
    return styles.badgeDefault;
  }

  // Phan loai de hien thi summary
  const total = bookings.length;
  const waitingCheckInCount = bookings.filter(b => b.Status === "Confirmed").length;
  const checkedInCount = bookings.filter(b => b.Status === "CheckedIn").length;
  const completedCount = bookings.filter(b => b.Status === "Completed").length;
  const cancelledCount = bookings.filter(b => ["Cancelled", "Refunded", "NoShow"].includes(b.Status)).length;

  const groupedBookings: Record<string, DailyBooking[]> = {};
  bookings.forEach((b) => {
    const courtName = b.CourtName || "Khu vực HLV";
    if (!groupedBookings[courtName]) {
      groupedBookings[courtName] = [];
    }
    groupedBookings[courtName].push(b);
  });

  // Sap xep cac san theo booking moi nhat trong san do
  const courtOrder = Object.keys(groupedBookings).sort((a, b) => {
    const aLatest = groupedBookings[a][0]?.CreatedAt ?? "";
    const bLatest = groupedBookings[b][0]?.CreatedAt ?? "";
    return bLatest > aLatest ? 1 : -1;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Quản lý Booking 📅</h1>
          <p>Xem danh sách đặt sân/HLV theo ngày, thực hiện check-in và hỗ trợ khách hàng.</p>
        </div>
        <div className={styles.headerRight}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.datePicker}
          />
          <button onClick={() => loadBookings(false)} className={styles.refreshButton}>
            🔄 Làm mới
          </button>
        </div>
      </header>

      {/* Summary boxes */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <h3>Tổng Booking</h3>
          <div className={styles.summaryValue}>{total}</div>
        </div>
        <div className={styles.summaryCard}>
          <h3>Chờ Check-in</h3>
          <div className={`${styles.summaryValue} ${styles.textWarning}`}>{waitingCheckInCount}</div>
        </div>
        <div className={styles.summaryCard}>
          <h3>Đang sử dụng sân</h3>
          <div className={`${styles.summaryValue} ${styles.textBlue}`}>{checkedInCount}</div>
        </div>
        <div className={styles.summaryCard}>
          <h3>Hoàn thành</h3>
          <div className={`${styles.summaryValue} ${styles.textSuccess}`}>{completedCount}</div>
        </div>
        <div className={styles.summaryCard}>
          <h3>Đã hủy / Vắng</h3>
          <div className={`${styles.summaryValue} ${styles.textError}`}>{cancelledCount}</div>
        </div>
      </div>

      {loading ? (
        <StateBox variant="loading" title="Đang tải danh sách booking" />
      ) : error ? (
        <StateBox variant="error" title="Lỗi tải dữ liệu" description={error} />
      ) : bookings.length === 0 ? (
        <StateBox
          variant="empty"
          title={`Không có booking nào ngày ${new Date(date).toLocaleDateString("vi-VN")}`}
          description="Hiện tại chưa có khách hàng nào đặt lịch vào ngày này."
        />
      ) : (
        <>
          <div className={styles.tabsContainer}>
            <button
              className={`${styles.tabBtn} ${selectedCourt === "Tất cả" ? styles.tabActive : ""}`}
              onClick={() => setSelectedCourt("Tất cả")}
            >
              Tất cả
            </button>
            {Object.keys(groupedBookings).map((courtName) => (
              <button
                key={courtName}
                className={`${styles.tabBtn} ${selectedCourt === courtName ? styles.tabActive : ""}`}
                onClick={() => setSelectedCourt(courtName)}
              >
                {courtName}
              </button>
            ))}
          </div>

          {Object.entries(groupedBookings)
            .filter(([courtName]) => selectedCourt === "Tất cả" || selectedCourt === courtName)
            .sort(([a], [b]) => {
              // Sap xep cac section san theo booking moi nhat trong san do
              const aLatest = groupedBookings[a][0]?.CreatedAt ?? "";
              const bLatest = groupedBookings[b][0]?.CreatedAt ?? "";
              return bLatest > aLatest ? 1 : -1;
            })
            .map(([courtName, courtBookings]) => (
            <div key={courtName} className={styles.courtSection}>
              <h2 className={styles.courtTitle}>{courtName}</h2>
              <div className={styles.tablePanel}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mã & Thời gian</th>
                      <th>Khách hàng</th>
                      <th>Dịch vụ</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courtBookings.map((b) => {
                      const isActioning = actioningId === b.BookingID;
                      const canCheckIn = b.Status === "Confirmed";
                      const canCancel = ["PendingPayment", "Confirmed", "Paid"].includes(b.Status);

                      return (
                        <tr key={b.BookingID} className={isActioning ? styles.rowActioning : ""}>
                          {/* Cột 1: Mã + Giờ */}
                          <td>
                            <div className={styles.bookingCode}>{b.BookingCode}</div>
                            <div className={styles.bookingTime}>
                              ⏱️ {b.StartTime} - {b.EndTime}
                            </div>
                          </td>

                          {/* Cột 2: Khách */}
                          <td>
                            <div className={styles.playerName}>{b.PlayerName}</div>
                            <div className={styles.playerContact}>
                              {b.PlayerPhone || b.PlayerEmail}
                            </div>
                          </td>

                          {/* Cột 3: Dịch vụ */}
                          <td>
                            <div className={styles.serviceItem}>
                              {b.BookingType === "Court" || b.BookingType === "Combo" ? (
                                <>🏟️ {b.CourtName}</>
                              ) : null}
                            </div>
                            <div className={styles.serviceItem}>
                              {b.BookingType === "Coach" || b.BookingType === "Combo" ? (
                                <>👨‍🏫 HLV {b.CoachName}</>
                              ) : null}
                            </div>
                          </td>

                          {/* Cột 4: Tiền */}
                          <td>
                            <div className={styles.amount}>{formatCurrency(b.TotalAmount)}</div>
                            {b.PaymentMethod && (
                              <div className={styles.paymentMethod}>💳 {b.PaymentMethod}</div>
                            )}
                          </td>

                          {/* Cột 5: Status */}
                          <td>
                            <span className={`${styles.badge} ${getStatusClass(b.Status)}`}>
                              {getStatusLabel(b.Status)}
                            </span>
                          {b.CheckInTime && (
                              <div className={styles.checkInTime}>
                                Lúc {new Date(b.CheckInTime).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Asia/Ho_Chi_Minh"
                                })}
                              </div>
                            )}
                          </td>

                          {/* Cột 6: Hành động */}
                          <td>
                            <div className={styles.actionCell}>
                              {canCheckIn && (
                                <button
                                  onClick={() => handleCheckIn(b.BookingID)}
                                  disabled={isActioning}
                                  className={styles.btnCheckIn}
                                  title="Đánh dấu khách đã đến"
                                >
                                  {isActioning ? "..." : "✅ Check-in"}
                                </button>
                              )}
                              {canCancel && (
                                <button
                                  onClick={() => handleCancel(b.BookingID)}
                                  disabled={isActioning}
                                  className={styles.btnCancel}
                                  title="Hủy booking (có thể hoàn tiền tùy luật)"
                                >
                                  {isActioning ? "..." : "❌ Hủy"}
                                </button>
                              )}
                              {!canCheckIn && !canCancel && !["Cancelled", "Refunded"].includes(b.Status) && (
                                <span className={styles.noAction}>-</span>
                              )}
                              {["Cancelled", "Refunded"].includes(b.Status) && (
                                b.RefundCode ? (
                                  <button
                                    onClick={() => router.push(`/admin/refunds?search=${b.RefundCode}`)}
                                    className={styles.btnCheckIn}
                                    style={{ background: "#f8fafc", color: "#6366f1", border: "1px solid #c7d2fe", fontWeight: 600 }}
                                    title="Xem chi tiết hoàn tiền"
                                  >
                                    🔍 {b.RefundCode}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => router.push(`/admin/refunds?search=${b.BookingCode}`)}
                                    className={styles.btnCheckIn}
                                    style={{ background: "#3b82f6", color: "white" }}
                                    title="Chuyển đến trang Hoàn tiền"
                                  >
                                    💸 Hoàn tiền
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
