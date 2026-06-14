"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserManagement } from "@/modules/admin/user-management/hooks/useUserManagement";
import type { AdminUserItem } from "@/types/admin-user.types";
import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const { users, total, totalPages, isLoading, error, refetch } = useUserManagement({
    search, page, isLocked: filterStatus || undefined, roleName: "Player",
  });

  // ── Fetch bookings for a player ──
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

  // ── Lock / Unlock ──
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
      // Nếu đang xem detail của người bị lock thì update local state
      if (detailPlayer && detailPlayer.userId === lockTarget.userId) {
        setDetailPlayer(p => p ? { ...p, status: isLocking ? "Locked" : "Active" } : p);
      }
    } catch (e: any) {
      setLockError(e.message ?? "Lỗi thao tác");
    } finally {
      setLockLoading(false);
    }
  }

  // ── Search debounce ──
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>👥 Quản lý Người chơi</h1>
          <p className={styles.pageSub}>Xem hồ sơ, lịch sử booking và quản lý tài khoản người chơi</p>
        </div>
        <span className={styles.totalBadge}>{total} người chơi</span>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value as "" | "true" | "false"); setPage(1); }}
          className={styles.filterSelect}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="false">Đang hoạt động</option>
          <option value="true">Đã bị khóa</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          <span>⚠️ {error}</span>
          <button onClick={() => refetch()} className={styles.retryBtn}>Thử lại</button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : !error && users.length === 0 ? (
        <EmptyState />
      ) : !error ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Người chơi</th>
                <th>Số điện thoại</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} className={styles.tableRow} onClick={() => openDetail(user)}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>{user.fullName.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className={styles.userName}>{user.fullName}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.tdMuted}>{user.phoneNumber ?? "—"}</td>
                  <td className={styles.tdMuted}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td><StatusBadge status={user.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className={styles.actions}>
                      <button
                        className={styles.btnDetail}
                        onClick={() => openDetail(user)}
                      >
                        Xem chi tiết
                      </button>
                      {user.status === "Locked" ? (
                        <button className={styles.btnUnlock} onClick={() => { setLockTarget(user); setLockReason(""); setLockError(""); }}>
                          Mở khóa
                        </button>
                      ) : (
                        <button className={styles.btnLock} onClick={() => { setLockTarget(user); setLockReason(""); setLockError(""); }}>
                          Khóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>Trang <strong>{page}</strong> / <strong>{totalPages}</strong></span>
          <div className={styles.pageBtns}>
            <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
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
            <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
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
  );
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

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        {/* Drawer header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerAvatar}>{player.fullName.charAt(0).toUpperCase()}</div>
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
            <InfoRow icon="📱" label="Điện thoại" value={player.phoneNumber ?? "—"} />
            <InfoRow icon="📅" label="Ngày tham gia" value={player.createdAt ? new Date(player.createdAt).toLocaleDateString("vi-VN") : "—"} />
            <InfoRow icon="🎭" label="Quyền" value={player.roles.map(r => r.roleName).join(", ") || "Player"} />
          </div>
        </div>

        {/* Stats */}
        <div className={styles.drawerSection}>
          <h3 className={styles.sectionTitle}>Thống kê</h3>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{bookings.length}</span>
              <span className={styles.statLabel}>Tổng booking</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{completedCount}</span>
              <span className={styles.statLabel}>Đã hoàn thành</span>
            </div>
            <div className={styles.statCard}>
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
            <div className={styles.bookingEmpty}>Chưa có lịch sử booking</div>
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
            <button className={styles.btnUnlockLg} onClick={onUnlock}>🔓 Mở khóa tài khoản</button>
          ) : (
            <button className={styles.btnLockLg} onClick={onLock}>🔒 Khóa tài khoản</button>
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
            <h2 className={styles.modalTitle}>{isLocked ? "🔓 Mở khóa tài khoản" : "🔒 Khóa tài khoản"}</h2>
            <p className={styles.modalSub}>{user.fullName} · {user.email}</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} disabled={loading}>×</button>
        </div>
        <div className={styles.modalBody}>
          {error && <div className={styles.modalError}>⚠️ {error}</div>}
          {isLocked ? (
            <div className={styles.infoBox}>
              ✅ Tài khoản sẽ được kích hoạt trở lại và người chơi có thể đăng nhập.
            </div>
          ) : (
            <>
              <div className={styles.warnBox}>⚠️ Người chơi sẽ không thể đăng nhập sau khi bị khóa.</div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lý do khóa</label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Nhập lý do khóa tài khoản..."
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
            <button className={styles.btnDanger} onClick={() => onSubmit(true)} disabled={loading}>
              {loading ? "Đang khóa..." : "Xác nhận khóa"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon}>{icon}</span>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") return <span className={`${styles.badge} ${styles.badgeActive}`}>● Hoạt động</span>;
  if (status === "Locked") return <span className={`${styles.badge} ${styles.badgeLocked}`}>● Đã khóa</span>;
  return <span className={`${styles.badge} ${styles.badgeInactive}`}>● Không hoạt động</span>;
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

function SkeletonTable() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Người chơi</th><th>Số điện thoại</th><th>Ngày tham gia</th><th>Trạng thái</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i}>
              <td><div className={styles.skeletonCell}><div className={styles.skeletonAvatar} /><div><div className={styles.skeletonLine} style={{ width: 120 }} /><div className={styles.skeletonLine} style={{ width: 160, marginTop: 6 }} /></div></div></td>
              <td><div className={styles.skeletonLine} style={{ width: 90 }} /></td>
              <td><div className={styles.skeletonLine} style={{ width: 70 }} /></td>
              <td><div className={styles.skeletonPill} /></td>
              <td><div className={styles.skeletonActions} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.emptyBox}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      <p className={styles.emptyTitle}>Không tìm thấy người chơi</p>
      <p className={styles.emptySub}>Thử thay đổi từ khóa hoặc bộ lọc.</p>
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
