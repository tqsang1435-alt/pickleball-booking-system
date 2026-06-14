"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getTodayOperations,
  checkInBooking,
  completeBooking,
  markBookingNoShow,
  getBookingLogs,
} from "@/services/operationApi";
import type {
  TodayOperationsResponse,
  OperationBooking,
  AuditLogItem,
} from "@/types/operationTypes";
import { getToken, getUser } from "@/utils/authStorage";
import styles from "./OperationsPage.module.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayVN() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

function nowVN() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
}

const STATUS_LABEL: Record<string, string> = {
  PendingPayment: "Chờ thanh toán",
  Paid:           "Đã thanh toán",
  Confirmed:      "Chờ check-in",
  CheckedIn:      "Đang sử dụng sân",
  Completed:      "Hoàn thành",
  Cancelled:      "Đã hủy",
  Refunded:       "Đã hoàn tiền",
  NoShow:         "Vắng mặt",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const router = useRouter();
  const [token, setToken]     = useState<string | null>(null);
  const [data, setData]       = useState<TodayOperationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [date, setDate]       = useState(todayVN);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actioningId, setActioningId]   = useState<number | null>(null);

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    booking: OperationBooking;
    type: "checkin" | "complete" | "noshow";
  } | null>(null);
  const [noShowNote, setNoShowNote] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Logs modal
  const [logsBooking, setLogsBooking] = useState<OperationBooking | null>(null);
  const [logs, setLogs]               = useState<AuditLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Auth
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    const role = String(u?.RoleName || u?.role || u?.roles?.[0] || "").toLowerCase();
    if (!t || (!role.includes("admin") && !role.includes("staff") && !role.includes("manager"))) {
      router.push("/login");
      return;
    }
    // Staff chỉ check-in / no-show — không được "Hoàn thành"
    setIsStaff(role.includes("staff") && !role.includes("admin") && !role.includes("manager"));
    setToken(t);
  }, [router]);

  useEffect(() => { if (token) load(); }, [token, date]);

  async function load(silent = false) {
    if (!token) return;
    try {
      if (!silent) setLoading(true);
      setError("");
      setData(await getTodayOperations(token, date));
    } catch (e: any) {
      setError(e.message || "Không thể tải dữ liệu.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // ── Filtered bookings ──
  const bookings = data?.bookings ?? [];

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      if (search.trim()) {
        const kw = search.toLowerCase();
        return (
          b.bookingCode.toLowerCase().includes(kw) ||
          b.customerName.toLowerCase().includes(kw) ||
          (b.customerPhone ?? "").toLowerCase().includes(kw) ||
          (b.customerEmail ?? "").toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [bookings, filterStatus, search]);

  // Sort: Confirmed first, then CheckedIn, then rest
  const sorted = useMemo(() => {
    const order: Record<string, number> = { Confirmed: 0, CheckedIn: 1, Completed: 2, Cancelled: 3, NoShow: 4 };
    return [...filtered].sort((a, b) => {
      const oa = order[a.status] ?? 5;
      const ob = order[b.status] ?? 5;
      if (oa !== ob) return oa - ob;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [filtered]);

  // ── Actions ──
  function openConfirm(booking: OperationBooking, type: "checkin" | "complete" | "noshow") {
    setConfirm({ booking, type });
    setNoShowNote("");
    setConfirmError("");
  }

  async function submitConfirm() {
    if (!confirm || !token) return;
    const { booking, type } = confirm;
    if (type === "noshow" && !noShowNote.trim()) {
      setConfirmError("Vui lòng nhập lý do vắng mặt.");
      return;
    }
    setConfirmLoading(true);
    setConfirmError("");
    try {
      setActioningId(booking.bookingId);
      if (type === "checkin")  await checkInBooking(token, booking.bookingId);
      if (type === "complete") await completeBooking(token, booking.bookingId);
      if (type === "noshow")   await markBookingNoShow(token, booking.bookingId, noShowNote.trim());
      setConfirm(null);
      await load(true);
    } catch (e: any) {
      setConfirmError(e.message || "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setConfirmLoading(false);
      setActioningId(null);
    }
  }

  async function openLogs(booking: OperationBooking) {
    if (!token) return;
    setLogsBooking(booking);
    setLogs([]);
    setLogsLoading(true);
    try {
      setLogs(await getBookingLogs(token, booking.bookingId));
    } catch { /* silent */ }
    setLogsLoading(false);
  }

  // ── Summary ──
  const s = data?.summary;

  // ── Time validation helpers — không giới hạn time window ──
  function canCheckIn(_b: OperationBooking) { return true; }
  function canNoShow(_b: OperationBooking)  { return true; }
  function canComplete(_b: OperationBooking) { return true; }

  // ── Render ──
  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vận hành hôm nay</h1>
          <p className={styles.subtitle}>Check-in khách, theo dõi sân và xử lý ca làm việc</p>
        </div>
        <div className={styles.headerRight}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={styles.datePicker}
          />
          <button className={styles.btnRefresh} onClick={() => load(false)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Auto no-show banner ── */}
      {data?.autoNoShowCount ? (
        <div className={styles.autoBanner}>
          🤖 Hệ thống đã tự động đánh dấu <strong>{data.autoNoShowCount}</strong> booking quá hạn là No-show.
        </div>
      ) : null}

      {/* ── Summary cards ── */}
      {s && (
        <div className={styles.summaryGrid}>
          <SummaryCard label="Tổng booking"   value={s.totalBookings} />
          <SummaryCard label="Chờ check-in"   value={s.waitingCheckIn} accent="orange" onClick={() => setFilterStatus("Confirmed")} />
          <SummaryCard label="Đang sử dụng sân" value={s.checkedIn}      accent="blue"   onClick={() => setFilterStatus("CheckedIn")} />
          <SummaryCard label="Hoàn thành"     value={s.completed}      accent="green"  onClick={() => setFilterStatus("Completed")} />
          <SummaryCard label="Đã hủy"         value={s.cancelled}      accent="red"    onClick={() => setFilterStatus("Cancelled")} />
          <SummaryCard label="Vắng mặt"       value={s.noShow}         accent="purple" onClick={() => setFilterStatus("NoShow")} />
        </div>
      )}

      {/* ── Search + filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm mã booking, tên khách, số điện thoại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch("")}>×</button>
          )}
        </div>
        <div className={styles.statusTabs}>
          {[
            { key: "all",           label: "Tất cả" },
            { key: "Confirmed",     label: "Chờ check-in" },
            { key: "CheckedIn",     label: "Đang sử dụng sân" },
            { key: "Completed",     label: "Hoàn thành" },
            { key: "Cancelled",     label: "Đã hủy" },
            { key: "NoShow",        label: "Vắng mặt" },
          ].map(tab => (
            <button
              key={tab.key}
              className={`${styles.statusTab} ${filterStatus === tab.key ? styles.statusTabActive : ""}`}
              onClick={() => setFilterStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <div className={styles.errorBox}>
          <span>⚠️ {error}</span>
          <button className={styles.retryBtn} onClick={() => load(false)}>Thử lại</button>
        </div>
      ) : sorted.length === 0 ? (
        <div className={styles.emptyBox}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1.2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <p className={styles.emptyTitle}>
            {search || filterStatus !== "all"
              ? "Không tìm thấy booking phù hợp"
              : `Không có booking ngày ${new Date(date + "T00:00:00").toLocaleDateString("vi-VN")}`}
          </p>
          {(search || filterStatus !== "all") && (
            <button className={styles.clearFilter} onClick={() => { setSearch(""); setFilterStatus("all"); }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã booking</th>
                <th>Khách hàng</th>
                <th>Sân / Thời gian</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(b => {
                const isActioning = actioningId === b.bookingId;
                const isConfirmed  = b.status === "Confirmed";
                const isCheckedIn  = b.status === "CheckedIn";

                return (
                  <tr
                    key={b.bookingId}
                    className={`${styles.tableRow} ${isActioning ? styles.rowActioning : ""} ${isConfirmed ? styles.rowPriority : ""}`}
                  >
                    {/* Mã + giờ */}
                    <td>
                      <span className={styles.bookingCode}>{b.bookingCode}</span>
                      <div className={styles.bookingTime}>⏱ {b.startTime} – {b.endTime}</div>
                    </td>

                    {/* Khách */}
                    <td>
                      <div className={styles.customerName}>{b.customerName}</div>
                      <div className={styles.customerContact}>
                        {b.customerPhone && <span>📱 {b.customerPhone}</span>}
                        {b.customerEmail && !b.customerPhone && <span>{b.customerEmail}</span>}
                      </div>
                    </td>

                    {/* Sân */}
                    <td>
                      <div className={styles.courtName}>
                        {b.courtName ? `🏟 ${b.courtName}` : "—"}
                      </div>
                      <div className={styles.bookingDate}>
                        {new Date(b.bookingDate + "T00:00:00").toLocaleDateString("vi-VN")}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={b.status} />
                      {b.checkInTime && (
                        <div className={styles.checkInTime}>
                          Check-in lúc {new Date(b.checkInTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actionCell}>
                        {isConfirmed && (
                          <>
                            <button
                              className={styles.btnCheckIn}
                              disabled={isActioning}
                              title="Check-in khách"
                              onClick={() => openConfirm(b, "checkin")}
                            >
                              ✅ Check-in
                            </button>
                            <button
                              className={styles.btnNoShow}
                              disabled={isActioning}
                              title="Ghi nhận vắng mặt"
                              onClick={() => openConfirm(b, "noshow")}
                            >
                              ❌ No-show
                            </button>
                          </>
                        )}
                        {isCheckedIn && !isStaff && (
                          <button
                            className={styles.btnComplete}
                            disabled={isActioning}
                            title="Xác nhận khách đã chơi xong"
                            onClick={() => openConfirm(b, "complete")}
                          >
                            🏁 Hoàn thành
                          </button>
                        )}
                        {isCheckedIn && isStaff && (
                          <span className={styles.checkedInNote}>Đang sử dụng sân</span>
                        )}
                        <button
                          className={styles.btnLog}
                          onClick={() => openLogs(b)}
                        >
                          📜
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirm && (
        <div className={styles.modalOverlay} onClick={() => setConfirm(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {confirm.type === "checkin"  && "✅ Xác nhận Check-in"}
                {confirm.type === "complete" && "🏁 Xác nhận Hoàn thành"}
                {confirm.type === "noshow"   && "❌ Ghi nhận Vắng mặt"}
              </h3>
              <button className={styles.modalClose} onClick={() => setConfirm(null)} disabled={confirmLoading}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.bookingCard}>
                <div className={styles.bookingCardCode}>{confirm.booking.bookingCode}</div>
                <div className={styles.bookingCardName}>{confirm.booking.customerName}</div>
                {confirm.booking.customerPhone && (
                  <div className={styles.bookingCardSub}>📱 {confirm.booking.customerPhone}</div>
                )}
                <div className={styles.bookingCardSub}>
                  🏟 {confirm.booking.courtName ?? "—"} &nbsp;·&nbsp; ⏱ {confirm.booking.startTime} – {confirm.booking.endTime}
                </div>
              </div>

              {confirm.type === "checkin" && (
                <div className={styles.infoBox}>
                  Khách đã có mặt tại sân. Xác nhận check-in để bắt đầu lượt chơi.
                </div>
              )}
              {confirm.type === "complete" && (
                <div className={styles.infoBox}>
                  Xác nhận khách đã chơi xong, rời sân và lượt đặt đã hoàn thành.
                </div>
              )}
              {confirm.type === "noshow" && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lý do vắng mặt *</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={3}
                    placeholder="VD: Khách không đến sau 15 phút kể từ giờ bắt đầu..."
                    value={noShowNote}
                    onChange={e => { setNoShowNote(e.target.value); setConfirmError(""); }}
                    disabled={confirmLoading}
                  />
                </div>
              )}

              {confirmError && <div className={styles.modalError}>⚠️ {confirmError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setConfirm(null)} disabled={confirmLoading}>
                Hủy
              </button>
              <button
                className={confirm.type === "noshow" ? styles.btnDanger : styles.btnPrimary}
                onClick={submitConfirm}
                disabled={confirmLoading}
              >
                {confirmLoading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logs Modal ── */}
      {logsBooking && (
        <div className={styles.modalOverlay} onClick={() => setLogsBooking(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📜 Lịch sử — {logsBooking.bookingCode}</h3>
              <button className={styles.modalClose} onClick={() => setLogsBooking(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {logsLoading ? (
                <div className={styles.logsLoading}><div className={styles.miniSpinner} /><span>Đang tải...</span></div>
              ) : logs.length === 0 ? (
                <div className={styles.logsEmpty}>Chưa có lịch sử thao tác.</div>
              ) : (
                <div className={styles.logList}>
                  {logs.map(log => (
                    <div key={log.logId} className={styles.logItem}>
                      <div className={styles.logTop}>
                        <span className={styles.logAction}>{log.action}</span>
                        <span className={styles.logTime}>{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className={styles.logActor}>Bởi: {log.actorName}</div>
                      {log.note && <div className={styles.logNote}>{log.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, accent, onClick }: {
  label: string; value: number;
  accent?: "orange" | "blue" | "green" | "red" | "purple";
  onClick?: () => void;
}) {
  const accentClass = accent ? styles[`accent_${accent}`] : "";
  return (
    <div className={`${styles.summaryCard} ${onClick ? styles.summaryCardClickable : ""} ${accentClass}`} onClick={onClick}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed:      styles.badgeOrange,
    CheckedIn:      styles.badgeBlue,
    Completed:      styles.badgeGreen,
    Cancelled:      styles.badgeRed,
    NoShow:         styles.badgePurple,
    PendingPayment: styles.badgeGray,
    Paid:           styles.badgeGreen,
    Refunded:       styles.badgeGray,
  };
  return (
    <span className={`${styles.badge} ${map[status] ?? styles.badgeGray}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mã booking</th><th>Khách hàng</th><th>Sân / Thời gian</th><th>Trạng thái</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className={styles.tableRow}>
              <td><div className={styles.skLine} style={{ width: 100 }} /><div className={styles.skLine} style={{ width: 70, marginTop: 6 }} /></td>
              <td><div className={styles.skLine} style={{ width: 130 }} /><div className={styles.skLine} style={{ width: 90, marginTop: 6 }} /></td>
              <td><div className={styles.skLine} style={{ width: 110 }} /></td>
              <td><div className={styles.skPill} /></td>
              <td><div className={styles.skActions} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
