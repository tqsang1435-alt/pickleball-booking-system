"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getTodayOperations, checkInBooking, completeBooking, markBookingNoShow } from "@/services/operationApi";
import type { TodayOperationsResponse, OperationBooking, NotificationItem } from "@/types/operationTypes";
import { getToken, getUser } from "@/utils/authStorage";
import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import styles from "./StaffDashboard.module.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayVN() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

const STATUS_LABEL: Record<string, string> = {
  Confirmed:      "Chờ check-in",
  CheckedIn:      "Đang sử dụng",
  Completed:      "Hoàn thành",
  Cancelled:      "Đã hủy",
  NoShow:         "Vắng mặt",
  PendingPayment: "Chờ thanh toán",
  Paid:           "Đã thanh toán",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("Nhân viên");
  const [data, setData] = useState<TodayOperationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Quick operation confirm
  const [confirmBooking, setConfirmBooking] = useState<OperationBooking | null>(null);
  const [confirmType, setConfirmType] = useState<"checkin" | "complete" | "noshow">("checkin");
  const [confirmNote, setConfirmNote] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Layout view toggle
  const [layoutView, setLayoutView] = useState<"list" | "grid">("list");

  // Auth + load
  useEffect(() => {
    const t = getToken();
    const u = getUser();
    const role = String(u?.RoleName || u?.role || u?.roles?.[0] || "").toLowerCase();
    if (!t || (!role.includes("admin") && !role.includes("staff") && !role.includes("manager"))) {
      router.push("/login");
      return;
    }
    setToken(t);
    setUserName(u?.FullName || u?.fullName || "Nhân viên");
  }, [router]);

  useEffect(() => {
    if (token) {
      load();
      fetchNotifications(token);
    }
  }, [token]);

  // Close notif dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setData(await getTodayOperations(token, todayVN()));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function fetchNotifications(t: string) {
    try {
      const res = await apiClient<ApiResponse<NotificationItem[]>>(
        "/api/notifications?limit=20",
        { token: t }
      );
      setNotifications(res.data ?? []);
    } catch { /* silent */ }
  }

  async function markAllRead() {
    if (!token) return;
    try {
      await apiClient("/api/notifications/read-all", {
        method: "POST",
        token,
      });
      setNotifications(prev => prev.map(n => ({ ...n, status: "Read" as const })));
    } catch { /* silent */ }
  }

  async function handleRefresh() {
    if (!token) return;
    load();
    fetchNotifications(token);
  }

  // ── Derived stats ──
  const s = data?.summary;
  const bookings = data?.bookings ?? [];
  const unreadCount = notifications.filter(n => n.status === "Unread").length;

  // Show all bookings for today sorted
  const allTodayBookings = useMemo(() => {
    const order: Record<string, number> = { Confirmed: 0, CheckedIn: 1, Completed: 2, Cancelled: 3, NoShow: 4, PendingPayment: 5, Paid: 6 };
    return [...bookings].sort((a, b) => {
      const oa = order[a.status] ?? 9;
      const ob = order[b.status] ?? 9;
      if (oa !== ob) return oa - ob;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [bookings]);

  // ── Actions ──
  function openConfirm(b: OperationBooking, type: "checkin" | "complete" | "noshow") {
    setConfirmBooking(b);
    setConfirmType(type);
    setConfirmNote("");
    setConfirmError("");
  }

  async function submitConfirm() {
    if (!confirmBooking || !token) return;
    if (confirmType === "noshow" && !confirmNote.trim()) {
      setConfirmError("Vui lòng nhập lý do.");
      return;
    }
    setConfirmLoading(true);
    setConfirmError("");
    try {
      setActioningId(confirmBooking.bookingId);
      if (confirmType === "checkin") await checkInBooking(token, confirmBooking.bookingId);
      if (confirmType === "complete") await completeBooking(token, confirmBooking.bookingId);
      if (confirmType === "noshow")  await markBookingNoShow(token, confirmBooking.bookingId, confirmNote.trim());
      setConfirmBooking(null);
      await load();
    } catch (e: any) {
      setConfirmError(e.message || "Thao tác thất bại.");
    } finally {
      setConfirmLoading(false);
      setActioningId(null);
    }
  }

  const todayLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.greeting}>
          <h1 className={styles.greetTitle}>Trung tâm Vận hành</h1>
          <p className={styles.greetDesc}>
            Quản lý thời gian thực các hoạt động sân và ca trực của nhân viên.
          </p>
        </div>

        <div className={styles.topActions}>
          <span className={styles.todayDate}>{todayLabel}</span>
          <span className={styles.shiftStatus}>CA TRỰC: ĐANG HOẠT ĐỘNG</span>
        </div>
      </div>

      {/* ── Stat cards (Sparklines) ── */}
      <div className={styles.statGrid}>
        <StatCard
          icon={<CourtIcon color="#2563eb" />}
          label="Sân đang sử dụng"
          value={loading ? "—" : `${s?.checkedIn ?? 0} / 8`}
          color="blue"
          trend="↗ +12%"
          sparklinePath="M0,20 C15,10 30,25 45,15 C60,5 75,25 90,18 L100,22 L100,30 L0,30 Z"
          sparklineStroke="M0,20 C15,10 30,25 45,15 C60,5 75,25 90,18 L100,22"
          sparklineColor="#2563eb"
        />
        <StatCard
          icon={<CoachIcon color="#16a34a" />}
          label="Huấn luyện viên trực"
          value={loading ? "—" : "02"}
          color="green"
          trend="Đang trực ca"
          sparklinePath="M0,15 C20,10 40,25 60,15 C80,5 90,20 100,10 L100,30 L0,30 Z"
          sparklineStroke="M0,15 C20,10 40,25 60,15 C80,5 90,20 100,10"
          sparklineColor="#16a34a"
        />
        <StatCard
          icon={<CalendarIcon color="#ea580c" />}
          label="Lịch đặt hôm nay"
          value={loading ? "—" : String(s?.totalBookings ?? 0)}
          color="orange"
          trend="↗ +5%"
          sparklinePath="M0,22 C15,12 30,28 45,18 C60,8 75,28 90,20 L100,25 L100,30 L0,30 Z"
          sparklineStroke="M0,22 C15,12 30,28 45,18 C60,8 75,28 90,20 L100,25"
          sparklineColor="#ea580c"
        />
        <StatCard
          icon={<CheckInIcon color="#8b5cf6" />}
          label="Lượt check-in"
          value={loading ? "—" : String(s?.checkedIn ?? 0)}
          color="purple"
          trend="88% Hoàn thành"
          sparklinePath="M0,25 C20,15 40,28 60,18 C80,8 90,22 100,12 L100,30 L0,30 Z"
          sparklineStroke="M0,25 C20,15 40,28 60,18 C80,8 90,22 100,12"
          sparklineColor="#8b5cf6"
        />
      </div>

      {/* ── Main 2-col layout ── */}
      <div className={styles.mainGrid}>

        {/* LEFT COLUMN: Court Activity / Bookings */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Hoạt động Sân hiện tại</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                <button
                  className={`${styles.bs} ${layoutView === "list" ? styles.bs_gray : ""}`}
                  style={{ border: "none", cursor: "pointer", background: layoutView === "list" ? "#fff" : "transparent" }}
                  onClick={() => setLayoutView("list")}
                >
                  Danh sách
                </button>
                <button
                  className={`${styles.bs} ${layoutView === "grid" ? styles.bs_gray : ""}`}
                  style={{ border: "none", cursor: "pointer", background: layoutView === "grid" ? "#fff" : "transparent" }}
                  onClick={() => setLayoutView("grid")}
                >
                  Lưới ô
                </button>
              </div>
              <Link href="/staff/operations?view=detail" className={styles.panelLink}>
                Xem đầy đủ
              </Link>
            </div>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : allTodayBookings.length === 0 ? (
            <div className={styles.emptyState}>
              <img
                src="/images/court_illustration.png"
                alt="Pickleball Court"
                className={styles.emptyImg}
              />
              <p className={styles.emptyTextTitle}>Không có lịch đặt hoạt động trong khung giờ này</p>
              <p className={styles.emptyTextDesc}>
                Các sân hiện tại đang trống. Đây là thời điểm thích hợp để thực hiện bảo trì sân hoặc hỗ trợ khách đặt tại quầy.
              </p>
            </div>
          ) : (
            <div className={styles.bookingList}>
              {allTodayBookings.slice(0, 10).map(b => {
                const isActioning = actioningId === b.bookingId;
                const isConfirmed = b.status === "Confirmed" || b.status === "Paid";
                const isCheckedIn = b.status === "CheckedIn";
                return (
                  <div
                    key={b.bookingId}
                    className={`${styles.bookingCard} ${styles[`bookingCardBorder_${b.status}`]}`}
                  >
                    <div className={styles.bookingLeft}>
                      <div className={styles.bookingTime}>{b.startTime} – {b.endTime}</div>
                      <div className={styles.bookingName}>{b.customerName}</div>
                      <div className={styles.bookingMeta}>
                        {b.courtName && <span className={styles.metaText}>{b.courtName}</span>}
                        {b.customerPhone && <span>SĐT: {b.customerPhone}</span>}
                      </div>
                    </div>
                    <div className={styles.bookingRight}>
                      <StatusBadge status={b.status} />
                      {isConfirmed && (
                        <div className={styles.quickActions}>
                          <button
                            className={styles.btnCheckin}
                            disabled={isActioning}
                            onClick={() => openConfirm(b, "checkin")}
                          >
                            Nhận sân
                          </button>
                          <button
                            className={styles.btnNoshow}
                            disabled={isActioning}
                            onClick={() => openConfirm(b, "noshow")}
                          >
                            Báo vắng
                          </button>
                        </div>
                      )}
                      {isCheckedIn && (
                        <div className={styles.quickActions}>
                          <span className={styles.playingBadge}>Đang chơi</span>
                          <button
                            className={styles.btnComplete}
                            disabled={isActioning}
                            onClick={() => openConfirm(b, "complete")}
                          >
                            Hoàn thành
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {allTodayBookings.length > 10 && (
                <Link href="/staff/operations?view=detail" className={styles.viewAll}>
                  Xem thêm {allTodayBookings.length - 10} lịch đặt khác →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Quick Operations Widget */}
          <div className={styles.panel}>
            <div className={styles.panelHeader} style={{ marginBottom: "0" }}>
              <span className={styles.panelTitle}>Thao tác nhanh</span>
            </div>
            <div className={styles.quickOpsGrid}>
              <Link href="/staff/operations?view=detail" className={styles.quickOpsBtn}>
                <div className={styles.quickOpsIcon}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                  </svg>
                </div>
                <span className={styles.quickOpsLabel}>Nhận sân</span>
              </Link>

              <Link href="/staff/operations?view=detail" className={styles.quickOpsBtn}>
                <div className={styles.quickOpsIcon}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                </div>
                <span className={styles.quickOpsLabel}>Trả sân</span>
              </Link>

              <Link href="/staff/bookings/walk-in" className={styles.quickOpsBtn}>
                <div className={styles.quickOpsIcon}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <span className={styles.quickOpsLabel}>Đặt sân</span>
              </Link>

              <Link href="/staff/operations?view=detail" className={styles.quickOpsBtn}>
                <div className={styles.quickOpsIcon}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z"/>
                  </svg>
                </div>
                <span className={styles.quickOpsLabel}>Hoàn tiền</span>
              </Link>
            </div>
          </div>

          {/* Current Shift Summary Widget */}
          <div className={styles.panel}>
            <div className={styles.panelHeader} style={{ marginBottom: "0" }}>
              <span className={styles.panelTitle}>Tóm tắt ca trực</span>
            </div>
            {!loading && s && (
              <div className={styles.summaryList}>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryLeft}>
                    <div className={styles.summaryIcon} style={{ background: "#eff6ff", color: "#2563eb" }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                      </svg>
                    </div>
                    <span className={styles.summaryText}>Nhân sự trực ca</span>
                  </div>
                  <span className={styles.summaryVal}>{userName}</span>
                </div>

                <div className={styles.summaryItem}>
                  <div className={styles.summaryLeft}>
                    <div className={styles.summaryIcon} style={{ background: "#f0fdf4", color: "#16a34a" }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <span className={styles.summaryText}>Doanh thu tạm tính</span>
                  </div>
                  <span className={styles.summaryVal}>
                    {((s.totalBookings || 0) * 150000).toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className={styles.summaryItem}>
                  <div className={styles.summaryLeft}>
                    <div className={styles.summaryIcon} style={{ background: "#fffbeb", color: "#ea580c" }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                    </div>
                    <span className={styles.summaryText}>Hiệu suất lấp đầy</span>
                  </div>
                  <span className={styles.summaryVal}>
                    {Math.max(0, 100 - Math.round((s.checkedIn / 8) * 100))}% trống
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SOP Operational Timeline Widget */}
          <div className={styles.panel}>
            <div className={styles.panelHeader} style={{ marginBottom: "0" }}>
              <span className={styles.panelTitle}>Quy trình vận hành</span>
            </div>
            <div className={styles.sopTimeline}>
              <div className={`${styles.sopStep} ${styles.sopStepActive}`}>
                <div className={styles.sopIndicator} />
                <div className={styles.sopContent}>
                  <span className={styles.sopTitle}>01. Chuẩn bị ca trực</span>
                  <span className={styles.sopDesc}>Kiểm tra vệ sinh các sân, rà soát lịch đặt hôm nay.</span>
                </div>
              </div>
              <div className={`${styles.sopStep} ${styles.sopStepActive}`}>
                <div className={styles.sopIndicator} />
                <div className={styles.sopContent}>
                  <span className={styles.sopTitle}>02. Đón tiếp & Nhận sân</span>
                  <span className={styles.sopDesc}>Check-in bằng SĐT hoặc Mã, bấm "Nhận sân" khi khách tới.</span>
                </div>
              </div>
              <div className={styles.sopStep}>
                <div className={styles.sopIndicator} />
                <div className={styles.sopContent}>
                  <span className={styles.sopTitle}>03. Theo dõi & Hỗ trợ</span>
                  <span className={styles.sopDesc}>Giám sát thời gian chơi, hỗ trợ khách mua nước/thuê vợt.</span>
                </div>
              </div>
              <div className={styles.sopStep}>
                <div className={styles.sopIndicator} />
                <div className={styles.sopContent}>
                  <span className={styles.sopTitle}>04. Trả sân & Báo cáo</span>
                  <span className={styles.sopDesc}>Bấm "Hoàn thành" ca chơi, bàn giao và đối soát doanh thu.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {confirmBooking && (
        <div className={styles.overlay} onClick={() => setConfirmBooking(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {confirmType === "checkin" && "Xác nhận Nhận sân"}
                {confirmType === "complete" && "Xác nhận Hoàn thành"}
                {confirmType === "noshow" && "Ghi nhận Vắng mặt (No-show)"}
              </h3>
              <button className={styles.modalClose} onClick={() => setConfirmBooking(null)} disabled={confirmLoading}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb", fontSize: "13px" }}>
                  {confirmBooking.bookingCode}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                  {confirmBooking.customerName}
                </div>
                {confirmBooking.customerPhone && (
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                    SĐT: {confirmBooking.customerPhone}
                  </div>
                )}
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Sân: {confirmBooking.courtName ?? "—"} &nbsp;·&nbsp; Giờ: {confirmBooking.startTime} – {confirmBooking.endTime}
                </div>
              </div>
              {confirmType === "checkin" && (
                <div className={styles.infoBox}>
                  Khách đã có mặt tại sân. Xác nhận để bắt đầu sử dụng sân.
                </div>
              )}
              {confirmType === "complete" && (
                <div className={styles.infoBox}>
                  Xác nhận khách đã chơi xong, rời sân và lượt đặt đã hoàn thành.
                </div>
              )}
              {confirmType === "noshow" && (
                <>
                  <div className={styles.warnBox}>
                    Hành động này sẽ đánh dấu khách vắng mặt và gửi thông báo cho khách.
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Lý do vắng mặt *</label>
                    <textarea
                      className={styles.formTextarea}
                      rows={3}
                      placeholder="Ví dụ: Khách không đến sau 15 phút kể từ giờ bắt đầu..."
                      value={confirmNote}
                      onChange={e => { setConfirmNote(e.target.value); setConfirmError(""); }}
                      disabled={confirmLoading}
                    />
                  </div>
                </>
              )}
              {confirmError && <div className={styles.modalError}>Lỗi: {confirmError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setConfirmBooking(null)} disabled={confirmLoading}>
                Hủy
              </button>
              <button
                className={confirmType === "noshow" ? styles.btnDanger : styles.btnPrimary}
                onClick={submitConfirm}
                disabled={confirmLoading}
              >
                {confirmLoading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  trend?: string;
  sparklinePath: string;
  sparklineStroke: string;
  sparklineColor: string;
}

function StatCard({
  icon,
  label,
  value,
  color,
  trend,
  sparklinePath,
  sparklineStroke,
  sparklineColor,
}: StatCardProps) {
  const gradientId = `spark-grad-${color}`;

  const renderValue = (val: string) => {
    if (val.includes("/")) {
      const parts = val.split("/");
      return (
        <span>
          {parts[0].trim()}
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8", marginLeft: "2px" }}>
            /{parts[1].trim()}
          </span>
        </span>
      );
    }
    return val;
  };

  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <div className={styles.statHeader}>
        <div className={styles.statIconBox}>{icon}</div>
        {trend && <span className={styles.statTrend} style={{ color: color === "green" ? "#16a34a" : "" }}>{trend}</span>}
      </div>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{renderValue(value)}</span>

      {/* Mini sparkline visualization at the bottom */}
      <div className={styles.sparklineWrap}>
        <svg className={styles.sparkline} viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.05"/>
              <stop offset="100%" stopColor={sparklineColor} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={sparklinePath} fill={`url(#${gradientId})`} />
          <path d={sparklineStroke} fill="none" stroke={sparklineColor} strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Confirmed:      styles.bs_orange,
    CheckedIn:      styles.bs_blue,
    Completed:      styles.bs_green,
    Cancelled:      styles.bs_red,
    NoShow:         styles.bs_purple,
    PendingPayment: styles.bs_gray,
    Paid:           styles.bs_green,
  };
  return (
    <span className={`${styles.bs} ${cls[status] ?? styles.bs_gray}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div className={styles.bookingList}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`${styles.bookingCard} ${styles.skeletonItem}`}>
          <div>
            <div className={styles.skLine} style={{ width: 60 }} />
            <div className={styles.skLine} style={{ width: 120, marginTop: 6 }} />
          </div>
          <div className={styles.skPill} />
        </div>
      ))}
    </div>
  );
}

// ─── Inline Icons ────────────────────────────────────────────────────────────

function CourtIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M12 3v18M2 12h20" />
    </svg>
  );
}

function CoachIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <circle cx="12" cy="7" r="4"/>
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    </svg>
  );
}

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}

function CheckInIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}
