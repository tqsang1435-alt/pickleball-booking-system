"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserManagement } from "@/modules/admin/user-management/hooks/useUserManagement";
import type { AdminUserItem } from "@/types/admin-user.types";
import { apiClient } from "@/services/apiClient";
import { getToken, getUser } from "@/utils/authStorage";
import type { ApiResponse } from "@/types/api";
import styles from "./AdminPlayersPage.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingRow = {
  BookingID: number;
  BookingCode: string;
  BookingType: string;
  BookingDate: string;
  TotalAmount: number;
  Status: string;
  CourtName: string | null;
  StartTime: string | null;
  EndTime: string | null;
  PaymentMethod: string | null;
  PaymentStatus: string | null;
  CreatedAt: string;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") return <span className={`${styles.badge} ${styles.badgeActive}`}>Hoạt động</span>;
  if (status === "Locked") return <span className={`${styles.badge} ${styles.badgeLocked}`}>Đã khóa</span>;
  return <span className={`${styles.badge} ${styles.badgeInactive}`}>Không hoạt động</span>;
}

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Completed:  { label: "Hoàn thành", cls: styles.bsCompleted },
    CheckedIn:  { label: "Đã check-in", cls: styles.bsCheckedIn },
    Confirmed:  { label: "Đã xác nhận", cls: styles.bsConfirmed },
    Pending:    { label: "Chờ thanh toán", cls: styles.bsPending },
    Holding:    { label: "Đang giữ chỗ", cls: styles.bsPending },
    Cancelled:  { label: "Đã hủy", cls: styles.bsCancelled },
  };
  const item = map[status] ?? { label: status, cls: styles.bsPending };
  return <span className={`${styles.bookingBadge} ${item.cls}`}>{item.label}</span>;
}

// ─── Player Detail Drawer ────────────────────────────────────────────────────

function PlayerDetailDrawer({
  player, bookings, bookingsLoading, onClose, onLock, onUnlock,
}: {
  player: AdminUserItem;
  bookings: BookingRow[];
  bookingsLoading: boolean;
  onClose: () => void;
  onLock: () => void;
  onUnlock: () => void;
}) {
  const isLocked = player.status === "Locked";
  const completedCount = bookings.filter(b => b.Status === "Completed" || b.Status === "CheckedIn").length;
  const cancelledCount = bookings.filter(b => b.Status === "Cancelled").length;

  const initials = useMemo(() => {
    const parts = player.fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "PL";
    return parts.map(n => n[0]).join("").slice(0, 2).toUpperCase();
  }, [player.fullName]);

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        {/* Drawer header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerAvatar}>{initials}</div>
          <div className={styles.drawerInfo}>
            <h2 className={styles.drawerName}>{player.fullName}</h2>
            <p className={styles.drawerEmail}>{player.email}</p>
            <StatusBadge status={player.status} />
          </div>
          <button className={styles.drawerClose} onClick={onClose}>×</button>
        </div>

        {/* Profile info */}
        <div className={styles.drawerSection}>
          <h3 className={styles.sectionTitle}>Thông tin tài khoản</h3>
          <div className={styles.infoGrid}>
            <div className={styles.drawerInfoRow}>
              <span className={styles.infoIcon}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </span>
              <span className={styles.infoLabel}>Điện thoại</span>
              <span className={styles.infoValue}>{player.phoneNumber ?? "—"}</span>
            </div>

            <div className={styles.drawerInfoRow}>
              <span className={styles.infoIcon}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </span>
              <span className={styles.infoLabel}>Ngày tham gia</span>
              <span className={styles.infoValue}>
                {player.createdAt ? new Date(player.createdAt).toLocaleDateString("vi-VN") : "—"}
              </span>
            </div>

            <div className={styles.drawerInfoRow}>
              <span className={styles.infoIcon}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </span>
              <span className={styles.infoLabel}>Quyền</span>
              <span className={styles.infoValue}>
                {player.roles.map(r => r.roleName).join(", ") || "Player"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.drawerSection}>
          <h3 className={styles.sectionTitle}>Thống kê đặt sân</h3>
          <div className={styles.statsRow}>
            <div className={styles.drawerStatCard}>
              <span className={styles.statNum}>{bookings.length}</span>
              <span className={styles.statLabel}>Tổng booking</span>
            </div>
            <div className={styles.drawerStatCard}>
              <span className={`${styles.statNum} ${styles.statGreen}`}>{completedCount}</span>
              <span className={styles.statLabel}>Đã hoàn thành</span>
            </div>
            <div className={styles.drawerStatCard}>
              <span className={`${styles.statNum} ${styles.statRed}`}>{cancelledCount}</span>
              <span className={styles.statLabel}>Đã hủy</span>
            </div>
          </div>
        </div>

        {/* Booking history */}
        <div className={styles.drawerSection} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <h3 className={styles.sectionTitle}>Lịch sử booking</h3>
          {bookingsLoading ? (
            <div className={styles.bookingLoading}>
              <div className={styles.miniSpinner} />
              <span>Đang tải...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className={styles.bookingEmpty}>Chưa có lịch sử đặt chỗ nào</div>
          ) : (
            <div className={styles.bookingList}>
              {bookings.map(b => (
                <div key={b.BookingID} className={styles.bookingItem}>
                  <div className={styles.bookingLeft}>
                    <span className={styles.bookingCode}>{b.BookingCode}</span>
                    <span className={styles.bookingCourt}>{b.CourtName ?? b.BookingType}</span>
                    {b.StartTime && b.EndTime && (
                      <span className={styles.bookingTime}>{b.StartTime} – {b.EndTime}</span>
                    )}
                    <span className={styles.bookingDate}>
                      {new Date(b.BookingDate ?? b.CreatedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className={styles.bookingRight}>
                    <span className={styles.bookingAmount}>
                      {b.TotalAmount.toLocaleString("vi-VN")}đ
                    </span>
                    <BookingStatusBadge status={b.Status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.drawerFooter}>
          {isLocked ? (
            <button className={styles.btnUnlockLg} onClick={onUnlock}>Mở khóa tài khoản</button>
          ) : (
            <button className={styles.btnLockLg} onClick={onLock}>Khóa tài khoản</button>
          )}
          <button className={styles.btnCloseLg} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ─── Lock Modal ───────────────────────────────────────────────────────────────

function LockModal({ user, reason, onReasonChange, loading, error, onClose, onSubmit }: {
  user: AdminUserItem;
  reason: string;
  onReasonChange: (v: string) => void;
  loading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (isLocking: boolean) => void;
}) {
  const isLocked = user.status === "Locked";
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}</h2>
            <p className={styles.modalSub}>{user.fullName} · {user.email}</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} disabled={loading}>×</button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.modalError}>⚠️ Lỗi: {error}</div>}
          {isLocked ? (
            <div className={styles.infoBox}>
              Tài khoản sẽ được kích hoạt trở lại và người chơi có thể tiếp tục đặt sân.
            </div>
          ) : (
            <>
              <div className={styles.warnBox}>Người chơi sẽ không thể đăng nhập hoặc đặt sân sau khi tài khoản bị khóa.</div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lý do khóa tài khoản *</label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Nhập lý do chi tiết khóa tài khoản..."
                  value={reason}
                  onChange={e => onReasonChange(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={loading}>Hủy</button>
          {isLocked ? (
            <button className={styles.btnPrimary} onClick={() => onSubmit(false)} disabled={loading}>
              {loading ? "Đang xử lý..." : "Mở khóa"}
            </button>
          ) : (
            <button className={styles.btnDanger} onClick={() => onSubmit(true)} disabled={loading || !reason.trim()}>
              {loading ? "Đang khóa..." : "Xác nhận khóa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className={styles.skeletonCardGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyBox}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <p className={styles.emptyTitle}>Không tìm thấy người chơi nào</p>
      <p className={styles.emptySub}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPlayersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"" | "true" | "false">("");

  // Detail drawer
  const [detailPlayer, setDetailPlayer] = useState<AdminUserItem | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Lock state
  const [lockTarget, setLockTarget] = useState<AdminUserItem | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");

  // Header Credentials
  const [currentAdminName, setCurrentAdminName] = useState("Admin");
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");

  useEffect(() => {
    const admin = getUser();
    if (admin) {
      setCurrentAdminName(admin.FullName || admin.fullName || "Admin");
      setCurrentAdminEmail(admin.Email || admin.email || "admin@pickleclub.vn");
    }
  }, []);

  const { users, total, totalPages, isLoading, error, refetch } = useUserManagement({
    search, page, isLocked: filterStatus || undefined, roleName: "Player",
  });

  // Fetch bookings for a player
  const openDetail = useCallback(async (player: AdminUserItem) => {
    setDetailPlayer(player);
    setBookings([]);
    setBookingsLoading(true);
    try {
      const res = await apiClient<ApiResponse<BookingRow[]>>(
        `/api/admin/users/${player.userId}/bookings`,
        { token: getToken() }
      );
      setBookings(res.data ?? []);
    } catch {
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // Lock / Unlock
  async function submitLock(isLocking: boolean) {
    if (!lockTarget) return;
    setLockLoading(true);
    setLockError("");
    try {
      if (isLocking) {
        await apiClient(`/api/admin/users/${lockTarget.userId}/lock`, {
          method: "POST", token: getToken(), body: { reason: lockReason || undefined },
        });
      } else {
        await apiClient(`/api/admin/users/${lockTarget.userId}/unlock`, {
          method: "POST", token: getToken(),
        });
      }
      setLockTarget(null);
      setLockReason("");
      refetch();
      
      if (detailPlayer && detailPlayer.userId === lockTarget.userId) {
        setDetailPlayer(p => p ? { ...p, status: isLocking ? "Locked" : "Active" } : p);
      }
    } catch (e: any) {
      setLockError(e.message ?? "Lỗi thao tác");
    } finally {
      setLockLoading(false);
    }
  }

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Extract initials for cover cover covers
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "PL";
    return parts.map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const adminInitials = useMemo(() => {
    return getInitials(currentAdminName);
  }, [currentAdminName]);

  return (
    <div className={styles.wrapper}>
      {/* ── Sticky Top Header Bar ── */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumbs}>
            <span>Quản trị</span>
            <span className={styles.chevron}>/</span>
            <span className={styles.currentCrumb}>Quản lý Người chơi</span>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.searchBar}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Lọc Trạng thái */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as "" | "true" | "false"); setPage(1); }}
            className={styles.filterSelect}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="false">Đang hoạt động</option>
            <option value="true">Đã bị khóa</option>
          </select>

          {/* Refresh Page */}
          <button className={styles.btnIcon} onClick={() => refetch()} title="Tải lại dữ liệu">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          {/* Avatar Admin */}
          <div className={styles.avatar} title={`${currentAdminName} (${currentAdminEmail})`}>
            {adminInitials}
          </div>
        </div>
      </header>

      {/* ── Main content area with gray background ── */}
      <div className={styles.contentArea}>
        
        {/* Title area */}
        <div className={styles.titleArea}>
          <div>
            <h1 className={styles.greetTitle}>Quản lý Người chơi</h1>
            <p className={styles.greetDesc}>Xem hồ sơ, lịch sử đặt sân và quản lý trạng thái tài khoản người chơi.</p>
          </div>
          <span className={styles.totalBadge}>{total} người chơi</span>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.errorBox}>
            <span>⚠️ Lỗi tải dữ liệu: {error}</span>
            <button onClick={() => refetch()} className={styles.retryBtn}>Thử lại</button>
          </div>
        )}

        {/* Player list as Card Grid (Courts style) */}
        {isLoading ? (
          <SkeletonGrid />
        ) : !error && users.length === 0 ? (
          <EmptyState />
        ) : !error ? (
          <div className={styles.playerCardGrid}>
            {users.map((user) => {
              const pInitials = getInitials(user.fullName);
              const coverIndex = user.userId % 5;
              return (
                <div key={user.userId} className={styles.playerCard}>
                  {/* Banner cover with color shift */}
                  <div className={`${styles.cardCover} ${styles[`cover_${coverIndex}`]}`}>
                    {/* Avatar circle initials overlay */}
                    <div className={styles.playerAvatarWrap}>
                      <div className={styles.playerAvatar}>{pInitials}</div>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{user.fullName}</h3>
                      <span className={styles.cardSub}>{user.email}</span>
                    </div>

                    <div className={styles.cardInfo}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Điện thoại:</span>
                        <span className={styles.infoVal}>{user.phoneNumber ?? "—"}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Ngày tham gia:</span>
                        <span className={styles.infoVal}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardStatusRow}>
                      <StatusBadge status={user.status} />
                    </div>
                  </div>

                  {/* Card footer action buttons */}
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => openDetail(user)}
                    >
                      Chi tiết
                    </button>
                    {user.status === "Locked" ? (
                      <button 
                        className={styles.btnUnlock} 
                        onClick={() => { setLockTarget(user); setLockReason(""); setLockError(""); }}
                      >
                        Mở khóa
                      </button>
                    ) : (
                      <button 
                        className={styles.btnLock} 
                        onClick={() => { setLockTarget(user); setLockReason(""); setLockError(""); }}
                      >
                        Khóa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Pagination controls */}
        {!isLoading && totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>Trang <strong>{page}</strong> / <strong>{totalPages}</strong></span>
            <div className={styles.pageBtns}>
              <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button>
              {buildPageNumbers(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className={styles.pageDots}>…</span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`}
                    onClick={() => setPage(p as number)}
                  >{p}</button>
                )
              )}
              <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
            </div>
          </div>
        )}

        {/* ── Detail Drawer ── */}
        {detailPlayer && (
          <PlayerDetailDrawer
            player={detailPlayer}
            bookings={bookings}
            bookingsLoading={bookingsLoading}
            onClose={() => setDetailPlayer(null)}
            onLock={() => { setLockTarget(detailPlayer); setLockReason(""); setLockError(""); }}
            onUnlock={() => { setLockTarget(detailPlayer); setLockReason(""); setLockError(""); }}
          />
        )}

        {/* ── Lock / Unlock Modal ── */}
        {lockTarget && (
          <LockModal
            user={lockTarget}
            reason={lockReason}
            onReasonChange={setLockReason}
            loading={lockLoading}
            error={lockError}
            onClose={() => { setLockTarget(null); setLockError(""); }}
            onSubmit={submitLock}
          />
        )}
      </div>
    </div>
  );
}
