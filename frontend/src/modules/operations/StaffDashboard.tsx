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

function nowVN() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
}

const STATUS_LABEL: Record<string, string> = {
  Confirmed:      "Chờ check-in",
  CheckedIn:      "Đang sử dụng sân",
  Completed:      "Hoàn thành",
  Cancelled:      "Đã hủy",
  NoShow:         "Vắng mặt",
  PendingPayment: "Chờ TT",
  Paid:           "Đã TT",
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

  // Show all bookings for today (all statuses) sorted: Confirmed first, then CheckedIn, rest by startTime
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
    weekday: "long", day: "numeric", month: "numeric", year: "numeric",
  });

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.greeting}>
          <span className={styles.greetSub}>
            Xin chào, <strong>{userName}</strong> 👋
            <span className={styles.rolePill}>Nhân viên</span>
          </span>
          <h1 className={styles.greetTitle}>Trung tâm Vận hành</h1>
          <p className={styles.greetDesc}>
            Xem thông tin đặt sân hôm nay, check-in nhận sân và quản lý vắng mặt (No-show).
          </p>
        </div>

        <div className={styles.topActions}>
          <span className={styles.todayDate}>{todayLabel}</span>

          {/* Notification bell */}
          <div className={styles.notifWrap} ref={notifRef}>
            <button
              className={styles.btnNotif}
              onClick={() => setNotifOpen(o => !o)}
              title="Thông báo"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className={styles.notifBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span className={styles.notifTitle}>Thông báo</span>
                  {unreadCount > 0 && (
                    <button className={styles.notifMarkAll} onClick={markAllRead}>
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>Không có thông báo mới</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.notificationId}
                        className={`${styles.notifItem} ${n.status === "Unread" ? styles.notifUnread : ""}`}
                      >
                        <div className={styles.notifItemTitle}>{n.title}</div>
                        <div className={styles.notifItemMsg}>{n.message}</div>
                        <div className={styles.notifItemTime}>
                          {new Date(n.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit", minute: "2-digit",
                            day: "numeric", month: "numeric",
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button className={styles.btnRefresh} onClick={handleRefresh}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statGrid}>
        <StatCard
          icon={<CalendarIcon color="#2563EB" />}
          label="Lịch đặt hôm nay"
          value={loading ? "—" : String(s?.totalBookings ?? 0)}
          sub="Tổng số lượt đặt"
          color="blue"
        />
        <StatCard
          icon={<CheckInIcon color="#16A34A" />}
          label="Đã Check-in"
          value={loading ? "—" : String(s?.checkedIn ?? 0)}
          sub="Lượt đang sử dụng sân"
          color="green"
        />
        <StatCard
          icon={<WaitIcon color="#9333EA" />}
          label="Chờ Check-in"
          value={loading ? "—" : String(s?.waitingCheckIn ?? 0)}
          sub="Cần xử lý"
          color="purple"
          highlight={(s?.waitingCheckIn ?? 0) > 0}
        />
        <StatCard
          icon={<NoShowIcon color="#D97706" />}
          label="Khách vắng"
          value={loading ? "—" : String(s?.noShow ?? 0)}
          sub="No-show hôm nay"
          color="orange"
        />
      </div>

      {/* ── Main 2-col layout ── */}
      <div className={styles.mainGrid}>

        {/* LEFT: Today bookings — tất cả, không chỉ active */}
        <div className={styles.schedulePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Danh sách booking hôm nay</span>
            <Link href="/staff/operations" className={styles.panelLink}>
              Xem đầy đủ →
            </Link>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : allTodayBookings.length === 0 ? (
            <div className={styles.emptyMsg}>
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1.2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <p>Hôm nay không có lịch đặt nào.</p>
            </div>
          ) : (
            <div className={styles.bookingList}>
              {allTodayBookings.slice(0, 10).map(b => {
                const isActioning = actioningId === b.bookingId;
                const isConfirmed = b.status === "Confirmed";
                const isCheckedIn = b.status === "CheckedIn";
                return (
                  <div
                    key={b.bookingId}
                    className={`${styles.bookingItem}
                      ${isConfirmed ? styles.bookingItemPriority : ""}
                      ${isCheckedIn ? styles.bookingItemChecked : ""}
                    `}
                  >
                    <div className={styles.bookingLeft}>
                      <div className={styles.bookingTime}>{b.startTime} – {b.endTime}</div>
                      <div className={styles.bookingName}>{b.customerName}</div>
                      <div className={styles.bookingMeta}>
                        {b.courtName && <span>🏟 {b.courtName}</span>}
                        {b.customerPhone && <span>· 📱 {b.customerPhone}</span>}
                      </div>
                    </div>
                    <div className={styles.bookingRight}>
                      <StatusBadge status={b.status} />
                      {isConfirmed && (
                        <div className={styles.quickActions}>
                          <button
                            className={styles.btnCheckin}
                            disabled={isActioning}
                            title="Check-in khách"
                            onClick={() => openConfirm(b, "checkin")}
                          >
                            ✅ Check-in
                          </button>
                          <button
                            className={styles.btnNoshow}
                            disabled={isActioning}
                            title="Ghi nhận vắng mặt"
                            onClick={() => openConfirm(b, "noshow")}
                          >
                            ❌
                          </button>
                        </div>
                      )}
                      {isCheckedIn && (
                        <div className={styles.quickActions}>
                          <span className={styles.playingBadge}>Đang sử dụng sân</span>
                          <button
                            className={styles.btnComplete}
                            disabled={isActioning}
                            title="Xác nhận khách đã chơi xong"
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
                <Link href="/staff/operations" className={styles.viewAll}>
                  Xem thêm {allTodayBookings.length - 10} booking khác →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Quick functions + mini summary */}
        <div className={styles.functionsPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Chức năng nhanh</span>
          </div>
          <div className={styles.fnGrid}>
            <Link
              href="/staff/operations"
              className={styles.fnCard}
              style={{ "--fn-color": "#2563EB", "--fn-bg": "#EFF6FF" } as React.CSSProperties}
            >
              <div className={styles.fnIconWrap} style={{ background: "#DBEAFE" }}>
                <CheckInIcon color="#2563EB" />
              </div>
              <div className={styles.fnInfo}>
                <span className={styles.fnLabel}>Bắt đầu Check-in</span>
                <span className={styles.fnDesc}>Xem và xử lý khách đến sân</span>
              </div>
              <ArrowIcon color="#2563EB" />
            </Link>

            <Link
              href="/staff/operations?view=detail"
              className={styles.fnCard}
              style={{ "--fn-color": "#0891B2", "--fn-bg": "#ECFEFF" } as React.CSSProperties}
            >
              <div className={styles.fnIconWrap} style={{ background: "#CFFAFE" }}>
                <GridIcon color="#0891B2" />
              </div>
              <div className={styles.fnInfo}>
                <span className={styles.fnLabel}>Tra cứu lịch đặt sân</span>
                <span className={styles.fnDesc}>Tìm theo ngày, mã, tên, SĐT</span>
              </div>
              <ArrowIcon color="#0891B2" />
            </Link>

            <Link
              href="/staff/bookings/walk-in"
              className={styles.fnCard}
              style={{ "--fn-color": "#9333EA", "--fn-bg": "#FAF5FF" } as React.CSSProperties}
            >
              <div className={styles.fnIconWrap} style={{ background: "#F3E8FF" }}>
                <PlusIcon color="#9333EA" />
              </div>
              <div className={styles.fnInfo}>
                <span className={styles.fnLabel}>Đặt sân trực tiếp</span>
                <span className={styles.fnDesc}>Tạo booking tại quầy cho khách vãng lai</span>
              </div>
              <ArrowIcon color="#9333EA" />
            </Link>
          </div>

          {/* Mini summary */}
          {!loading && s && (
            <div className={styles.miniSummary}>
              <div className={styles.miniSummaryTitle}>Tóm tắt ca hôm nay</div>
              <div className={styles.miniRows}>
                <MiniRow label="Tổng booking"  value={s.totalBookings} />
                <MiniRow label="Hoàn thành"    value={s.completed}     color="green" />
                <MiniRow label="Đã hủy"        value={s.cancelled}     color="red" />
                <MiniRow label="Vắng mặt"      value={s.noShow}        color="orange" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Nhiệm vụ trong ca ── */}
      <div className={styles.dutiesSection}>
        <h2 className={styles.dutiesSectionTitle}>Nhiệm vụ trong ca</h2>
        <div className={styles.dutiesGrid}>
          <DutyItem icon={<DutyIconCheck />}   color="#16A34A" bg="#F0FDF4" text="Check-in khách đến sân đúng giờ" />
          <DutyItem icon={<DutyIconSearch />}  color="#2563EB" bg="#EFF6FF" text="Tra cứu booking theo mã, tên, SĐT" />
          <DutyItem icon={<DutyIconComplete />} color="#7C3AED" bg="#F5F3FF" text="Xác nhận khách đã nhận sân và hoàn thành lượt chơi" />
          <DutyItem icon={<DutyIconWait />}    color="#D97706" bg="#FFFBEB" text="Theo dõi khách đang chờ check-in" />
          <DutyItem icon={<DutyIconNoShow />}  color="#DC2626" bg="#FEF2F2" text="Ghi nhận No-show khi khách vắng mặt" />
          <DutyItem icon={<DutyIconCourt />}   color="#0891B2" bg="#ECFEFF" text="Theo dõi tình trạng sân trong ca" />
          <DutyItem icon={<DutyIconBooking />} color="#CA8A04" bg="#FEFCE8" text="Hỗ trợ tạo booking trực tiếp tại quầy" />
          <DutyItem icon={<DutyIconReport />}  color="#DB2777" bg="#FDF2F8" text="Báo cáo sự cố vận hành cho quản lý" />
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {confirmBooking && (
        <div className={styles.overlay} onClick={() => setConfirmBooking(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {confirmType === "checkin" && "✅ Xác nhận Check-in"}
                {confirmType === "complete" && "🏁 Xác nhận Hoàn thành"}
                {confirmType === "noshow" && "❌ Ghi nhận Vắng mặt"}
              </h3>
              <button className={styles.modalClose} onClick={() => setConfirmBooking(null)} disabled={confirmLoading}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.bookingCard}>
                <span className={styles.bookingCardCode}>{confirmBooking.bookingCode}</span>
                <span className={styles.bookingCardName}>{confirmBooking.customerName}</span>
                {confirmBooking.customerPhone && (
                  <span className={styles.bookingCardSub}>📱 {confirmBooking.customerPhone}</span>
                )}
                <span className={styles.bookingCardSub}>
                  🏟 {confirmBooking.courtName ?? "—"} &nbsp;·&nbsp; ⏱ {confirmBooking.startTime} – {confirmBooking.endTime}
                </span>
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
                    ⚠️ Hành động này sẽ đánh dấu khách vắng mặt và gửi thông báo cho khách.
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Lý do vắng mặt *</label>
                    <textarea
                      className={styles.formTextarea}
                      rows={3}
                      placeholder="VD: Khách không đến sau 15 phút kể từ giờ bắt đầu..."
                      value={confirmNote}
                      onChange={e => { setConfirmNote(e.target.value); setConfirmError(""); }}
                      disabled={confirmLoading}
                    />
                  </div>
                </>
              )}
              {confirmError && <div className={styles.modalError}>⚠️ {confirmError}</div>}
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

function StatCard({ icon, label, value, sub, color, highlight }: {
  icon: React.ReactNode; label: string; value: string;
  sub: string; color: string; highlight?: boolean;
}) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]} ${highlight ? styles.statHighlight : ""}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statSub}>{sub}</div>
    </div>
  );
}

function MiniRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className={styles.miniRow}>
      <span className={styles.miniLabel}>{label}</span>
      <span className={`${styles.miniValue} ${color ? styles[`mini_${color}`] : ""}`}>{value}</span>
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
        <div key={i} className={`${styles.bookingItem} ${styles.skeletonItem}`}>
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

// ─── Icons ───────────────────────────────────────────────────────────────────

function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}

function CheckInIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}

function WaitIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function NoShowIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="17" y1="11" x2="23" y2="17"/>
      <line x1="23" y1="11" x2="17" y2="17"/>
    </svg>
  );
}

function GridIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="17" y1="11" x2="23" y2="11"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2" style={{ flexShrink: 0, opacity: 0.5 }}>
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

// ─── DutyItem + icons ────────────────────────────────────────────────────────

function DutyItem({ icon, text, color, bg }: {
  icon: React.ReactNode;
  text: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={styles.dutyItem}>
      <div
        className={styles.dutyIconBox}
        style={{ background: bg, border: `1px solid ${color}28` }}
      >
        <span style={{ color, display: "flex", alignItems: "center" }}>{icon}</span>
      </div>
      <span className={styles.dutyText}>{text}</span>
    </div>
  );
}

function DutyIconCheck() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function DutyIconSearch() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function DutyIconComplete() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  );
}

function DutyIconWait() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function DutyIconNoShow() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function DutyIconCourt() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="18" rx="1"/>
      <line x1="12" y1="3" x2="12" y2="21"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  );
}

function DutyIconBooking() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  );
}

function DutyIconReport() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
