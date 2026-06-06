"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayOperations, checkInBooking, completeBooking, markBookingNoShow, getBookingLogs } from "@/services/operationApi";
import type { TodayOperationsResponse, OperationBooking, AuditLogItem } from "@/types/operationTypes";
import { getToken, getUser } from "@/utils/authStorage";
import StateBox from "@/components/common/StateBox";
import styles from "./OperationsPage.module.css";

export default function OperationsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<TodayOperationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string>("Tất cả");

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  });
  const [filterStatus, setFilterStatus] = useState<string>("Tất cả");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");

  // Debounce search keyword
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  // Logs modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // No-show Modal
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [selectedNoShowBooking, setSelectedNoShowBooking] = useState<OperationBooking | null>(null);
  const [noShowReason, setNoShowReason] = useState("");
  const [noShowErrorMsg, setNoShowErrorMsg] = useState("");
  const [isSubmittingNoShow, setIsSubmittingNoShow] = useState(false);

  // Verify Role and Fetch Data
  useEffect(() => {
    const userToken = getToken();
    const user = getUser();
    const role = String(
      user?.RoleName || user?.role || user?.roles?.[0] || ""
    ).toLowerCase();

    // Chi Staff/Admin duoc truy cap
    if (!userToken || (!role.includes("admin") && !role.includes("staff"))) {
      router.push("/login");
      return;
    }

    setToken(userToken);
  }, [router]);

  useEffect(() => {
    if (token) {
      loadOperations();
    }
  }, [token, selectedDate]);

  async function loadOperations(silent = false) {
    if (!token) return;
    try {
      if (!silent) setLoading(true);
      setError("");
      const responseData = await getTodayOperations(token, selectedDate);
      setData(responseData);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách vận hành.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleCheckIn(bookingId: number) {
    if (!token) return;
    if (!window.confirm("Bạn có chắc muốn check-in booking này?")) return;

    try {
      setActioningId(bookingId);
      await checkInBooking(token, bookingId);
      await loadOperations(true);
    } catch (err: any) {
      alert(err.message || "Check-in thất bại");
    } finally {
      setActioningId(null);
    }
  }

  async function handleComplete(bookingId: number) {
    if (!token) return;
    if (!window.confirm("Bạn có chắc muốn hoàn thành booking này?")) return;

    try {
      setActioningId(bookingId);
      await completeBooking(token, bookingId);
      await loadOperations(true);
    } catch (err: any) {
      alert(err.message || "Hoàn thành thất bại");
    } finally {
      setActioningId(null);
    }
  }

  function handleOpenNoShowModal(booking: OperationBooking) {
    if (!token) return;
    setSelectedNoShowBooking(booking);
    setNoShowReason("");
    setNoShowErrorMsg("");
    setNoShowModalOpen(true);
  }

  async function confirmNoShow() {
    if (!token || !selectedNoShowBooking) return;
    const trimmedReason = noShowReason.trim();
    if (!trimmedReason) {
      setNoShowErrorMsg("Vui lòng nhập lý do No-show.");
      return;
    }

    try {
      setNoShowErrorMsg("");
      setIsSubmittingNoShow(true);
      setActioningId(selectedNoShowBooking.bookingId);
      await markBookingNoShow(token, selectedNoShowBooking.bookingId, trimmedReason);
      setNoShowModalOpen(false);
      await loadOperations(true);
    } catch (err: any) {
      setNoShowErrorMsg(err.message || "Đánh dấu No-show thất bại");
    } finally {
      setIsSubmittingNoShow(false);
      setActioningId(null);
    }
  }

  async function handleViewLogs(bookingId: number) {
    if (!token) return;
    try {
      setLogModalOpen(true);
      setLoadingLogs(true);
      const logs = await getBookingLogs(token, bookingId);
      setSelectedLogs(logs);
    } catch (err: any) {
      alert(err.message || "Không thể tải lịch sử.");
      setLogModalOpen(false);
    } finally {
      setLoadingLogs(false);
    }
  }

  function getStatusLabel(status: string) {
    const map: Record<string, string> = {
      PendingPayment: "Chờ thanh toán",
      Paid: "Đã thanh toán",
      Confirmed: "Đã xác nhận",
      CheckedIn: "Đã Check-in",
      Completed: "Hoàn thành",
      Cancelled: "Đã hủy",
      Refunded: "Đã hoàn tiền",
      NoShow: "No-show (Vắng)",
    };
    return map[status] ?? status;
  }

  function getStatusClass(status: string) {
    if (["Confirmed", "Paid"].includes(status)) return styles.badgeSuccess;
    if (status === "CheckedIn") return styles.badgeCheckedIn;
    if (status === "Completed") return styles.badgeCompleted;
    if (status === "PendingPayment") return styles.badgeWarning;
    if (["Cancelled", "Refunded", "NoShow"].includes(status)) return styles.badgeError;
    return styles.badgeDefault;
  }

  if (loading) {
    return (
      <div className={styles.page}>
         <StateBox variant="loading" title="Đang tải dữ liệu vận hành" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <StateBox variant="error" title="Lỗi tải dữ liệu" description={error} />
      </div>
    );
  }

  const { summary, bookings } = data || { summary: null, bookings: [] };
  
  // Client-side filtering
  const filteredBookings = bookings.filter((b) => {
    // Status Filter
    if (filterStatus !== "Tất cả" && b.status !== filterStatus) {
      return false;
    }
    
    // Keyword Filter
    if (debouncedKeyword.trim()) {
      const keyword = debouncedKeyword.toLowerCase();
      const matchName = b.customerName?.toLowerCase().includes(keyword);
      const matchEmail = b.customerEmail?.toLowerCase().includes(keyword);
      const matchPhone = b.customerPhone?.toLowerCase().includes(keyword);
      const matchCode = b.bookingCode?.toLowerCase().includes(keyword);
      
      if (!matchName && !matchEmail && !matchPhone && !matchCode) {
        return false;
      }
    }
    return true;
  });

  const groupedBookings: Record<string, OperationBooking[]> = {};
  filteredBookings.forEach((b) => {
    const courtName = b.courtName || "Khu vực HLV";
    if (!groupedBookings[courtName]) {
      groupedBookings[courtName] = [];
    }
    groupedBookings[courtName].push(b);
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Vận hành hôm nay 📋</h1>
          <p>Quản lý check-in, theo dõi trạng thái sân và khách đến chơi trong ngày.</p>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => loadOperations(false)} className={styles.refreshButton}>
            🔄 Làm mới
          </button>
        </div>
      </header>

      {data?.autoNoShowCount ? (
        <div style={{ backgroundColor: '#eef2ff', color: '#4f46e5', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🤖</span> Đã tự động đánh dấu {data.autoNoShowCount} booking quá hạn là No-show.
        </div>
      ) : null}

      {summary && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>Tổng Booking</h3>
            <div className={styles.summaryValue}>{summary.totalBookings}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Chờ Check-in</h3>
            <div className={`${styles.summaryValue} ${styles.textWarning}`}>{summary.waitingCheckIn}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Đã Check-in</h3>
            <div className={`${styles.summaryValue} ${styles.textBlue}`}>{summary.checkedIn}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Hoàn thành</h3>
            <div className={`${styles.summaryValue} ${styles.textSuccess}`}>{summary.completed}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Đã hủy</h3>
            <div className={`${styles.summaryValue} ${styles.textError}`}>{summary.cancelled}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>No-show</h3>
            <div className={`${styles.summaryValue} ${styles.textPurple}`}>{summary.noShow}</div>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label>Ngày:</label>
          <input
            type="date"
            className={styles.filterInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Trạng thái:</label>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="CheckedIn">Đã Check-in</option>
            <option value="Completed">Hoàn thành</option>
            <option value="PendingPayment">Chờ thanh toán</option>
            <option value="Paid">Đã thanh toán</option>
            <option value="Cancelled">Đã hủy</option>
            <option value="Refunded">Đã hoàn tiền</option>
            <option value="NoShow">No-show (Vắng)</option>
          </select>
        </div>
        <div className={`${styles.filterGroup} ${styles.filterSearch}`}>
          <label>Tìm kiếm:</label>
          <input
            type="text"
            className={styles.filterInput}
            style={{ width: "100%" }}
            placeholder="Tên, Email, SĐT, Mã Booking..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      {bookings.length === 0 ? (
        <StateBox
          variant="empty"
          title="Không có booking nào"
          description="Hiện tại chưa có khách hàng nào đặt lịch vào ngày này."
        />
      ) : filteredBookings.length === 0 ? (
        <StateBox
          variant="empty"
          title="Không tìm thấy kết quả"
          description="Không có booking nào khớp với bộ lọc của bạn."
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
            .map(([courtName, courtBookings]) => (
            <div key={courtName} className={styles.courtSection}>
              <h2 className={styles.courtTitle}>{courtName}</h2>
              <div className={styles.tablePanel}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mã & Thời gian</th>
                      <th>Khách hàng</th>
                      <th>Sân</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courtBookings.map((b) => {
                      const isActioning = actioningId === b.bookingId;
                      
                      // Calculate times for validation
                      const bookingStart = new Date(`${b.bookingDate}T${b.startTime}:00+07:00`);
                      const bookingEnd = new Date(`${b.bookingDate}T${b.endTime}:00+07:00`);
                      const now = new Date();

                      const minCheckInTime = new Date(bookingStart.getTime() - 30 * 60000);
                      const maxCheckInTime = new Date(bookingStart.getTime() + 15 * 60000);
                      const minNoShowTime = new Date(bookingStart.getTime() + 15 * 60000);

                      const isTooEarlyForCheckIn = now < minCheckInTime;
                      const isTooLateForCheckIn = now > maxCheckInTime;
                      const isTooEarlyForComplete = now < bookingEnd;
                      const isTooEarlyForNoShow = now < minNoShowTime;

                      // Titles for tooltips
                      let checkInTitle = "Đánh dấu khách đã đến";
                      if (isTooEarlyForCheckIn) checkInTitle = "Chưa đến thời gian check-in (chỉ được check-in trước 30 phút).";
                      if (isTooLateForCheckIn) checkInTitle = "Đã quá thời gian check-in (sau 15 phút). Vui lòng xử lý No-show.";

                      let completeTitle = "Đánh dấu khách đã chơi xong";
                      if (isTooEarlyForComplete) completeTitle = "Chưa đến thời gian kết thúc lượt chơi.";

                      let noShowTitle = "Đánh dấu khách không đến sân";
                      if (isTooEarlyForNoShow) noShowTitle = "Chỉ xử lý No-show sau 15 phút kể từ giờ bắt đầu.";

                      const isConfirmed = b.status === "Confirmed";
                      const isCheckedIn = b.status === "CheckedIn";

                      return (
                        <tr key={b.bookingId} className={isActioning ? styles.rowActioning : ""}>
                          <td>
                            <div className={styles.bookingCode}>{b.bookingCode}</div>
                            <div className={styles.bookingTime}>
                              ⏱️ {b.startTime} - {b.endTime}
                            </div>
                          </td>

                          <td>
                            <div className={styles.playerName}>{b.customerName}</div>
                            <div className={styles.playerContact}>
                              {b.customerPhone || "Chưa cập nhật SDT"}
                            </div>
                          </td>

                          <td>
                            <div className={styles.serviceItem}>
                              {b.courtName ? `🏟️ ${b.courtName}` : "N/A"}
                            </div>
                          </td>

                          <td>
                            <span className={`${styles.badge} ${getStatusClass(b.status)}`}>
                              {getStatusLabel(b.status)}
                            </span>
                            {b.checkInTime && (
                              <div className={styles.checkInTime}>
                                Lúc {new Date(b.checkInTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </td>

                          <td>
                            <div className={styles.actionCell}>
                              {isConfirmed && (
                                <button
                                  onClick={() => handleCheckIn(b.bookingId)}
                                  disabled={isActioning || isTooEarlyForCheckIn || isTooLateForCheckIn}
                                  className={`${styles.btnAction} ${styles.btnCheckIn}`}
                                  title={checkInTitle}
                                  style={{ opacity: (isTooEarlyForCheckIn || isTooLateForCheckIn) ? 0.5 : 1, cursor: (isTooEarlyForCheckIn || isTooLateForCheckIn) ? 'not-allowed' : 'pointer' }}
                                >
                                  {isActioning ? "..." : "✅ Check-in"}
                                </button>
                              )}
                              {isCheckedIn && (
                                <button
                                  onClick={() => handleComplete(b.bookingId)}
                                  disabled={isActioning || isTooEarlyForComplete}
                                  className={`${styles.btnAction} ${styles.btnComplete}`}
                                  title={completeTitle}
                                  style={{ opacity: isTooEarlyForComplete ? 0.5 : 1, cursor: isTooEarlyForComplete ? 'not-allowed' : 'pointer' }}
                                >
                                  {isActioning ? "..." : "🏁 Hoàn thành"}
                                </button>
                              )}
                              {isConfirmed && (
                                <button
                                  onClick={() => handleOpenNoShowModal(b)}
                                  disabled={isActioning || isTooEarlyForNoShow}
                                  className={`${styles.btnAction} ${styles.btnNoShow}`}
                                  title={noShowTitle}
                                  style={{ opacity: isTooEarlyForNoShow ? 0.5 : 1, cursor: isTooEarlyForNoShow ? 'not-allowed' : 'pointer' }}
                                >
                                  {isActioning ? "..." : "❌ No-show"}
                                </button>
                              )}
                              {!isConfirmed && !isCheckedIn && (
                                <span className={styles.noAction}></span>
                              )}
                              <button
                                onClick={() => handleViewLogs(b.bookingId)}
                                className={styles.btnLog}
                                title="Xem lịch sử"
                              >
                                📜 Lịch sử
                              </button>
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

      {/* MODAL LỊCH SỬ LOGS */}
      {logModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setLogModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📜 Lịch sử Booking</h3>
              <button onClick={() => setLogModalOpen(false)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {loadingLogs ? (
                <div style={{ textAlign: "center", padding: 20 }}>Đang tải...</div>
              ) : selectedLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "#64748b" }}>Chưa có lịch sử nào.</div>
              ) : (
                <ul className={styles.logList}>
                  {selectedLogs.map(log => (
                    <li key={log.logId} className={styles.logItem}>
                      <div className={styles.logHeader}>
                        <span className={styles.logAction}>{log.action}</span>
                        <span className={styles.logTime}>{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className={styles.logActor}>Bởi: {log.actorName}</div>
                      {log.note && <div className={styles.logNote}>Note: {log.note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NO-SHOW */}
      {noShowModalOpen && selectedNoShowBooking && (
        <div className={styles.modalOverlay} onClick={() => setNoShowModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận No-show</h3>
              <button onClick={() => setNoShowModalOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "16px" }}>
                Vui lòng nhập lý do khách không đến để ghi nhận vào lịch sử thao tác.
              </p>
              
              <div className={styles.bookingInfo}>
                <div><strong>Mã booking:</strong> {selectedNoShowBooking.bookingCode}</div>
                <div><strong>Khách hàng:</strong> {selectedNoShowBooking.customerName}</div>
                <div><strong>Sân:</strong> {selectedNoShowBooking.courtName || "N/A"}</div>
                <div><strong>Thời gian:</strong> {selectedNoShowBooking.startTime} - {selectedNoShowBooking.endTime}</div>
              </div>

              <div className={styles.formGroup}>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Ví dụ: Khách không đến sau 15 phút kể từ giờ bắt đầu..."
                  value={noShowReason}
                  onChange={(e) => {
                    setNoShowReason(e.target.value);
                    if (noShowErrorMsg) setNoShowErrorMsg("");
                  }}
                  disabled={isSubmittingNoShow}
                />
                {noShowErrorMsg && <div className={styles.modalError}>{noShowErrorMsg}</div>}
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.btnCancel} 
                  onClick={() => setNoShowModalOpen(false)}
                  disabled={isSubmittingNoShow}
                >
                  Hủy
                </button>
                <button 
                  className={styles.btnConfirmNoShow} 
                  onClick={confirmNoShow}
                  disabled={isSubmittingNoShow}
                >
                  {isSubmittingNoShow ? "Đang xử lý..." : "Xác nhận No-show"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
