"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminGetAllStaff, adminUpdateUser } from "@/services/userApi";
import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import { getImageUrl } from "@/utils/image";
import { getToken, getUser } from "@/utils/authStorage";
import StaffCreateModal from "./StaffCreateModal";
import styles from "./AdminStaffPage.module.css";

interface Props {
  token: string;
}

type StaffStatusFilter = "All" | "Active" | "Locked";
type RoleOption = { RoleID: number; RoleName: string; Status: string };

type StaffUser = {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber?: string | null;
  AvatarURL?: string | null;
  Status: "Active" | "Inactive" | "Locked" | string;
  Roles?: string | null;
  CreatedAt?: string | null;
  UpdatedAt?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  Admin: "Quản trị viên",
  Manager: "Quản lý",
  Staff: "Nhân viên",
  Coach: "Huấn luyện viên",
  Player: "Người chơi",
  Guest: "Khách",
};

const STATUS_LABELS: Record<string, string> = {
  Active: "Hoạt động",
  Locked: "Đã khóa",
  Inactive: "Ngừng hoạt động",
};

function splitRoles(roles?: string | null) {
  return (roles || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminStaffPage({ token }: Props) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);

  const [detailTarget, setDetailTarget] = useState<StaffUser | null>(null);

  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", phoneNumber: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [roleTarget, setRoleTarget] = useState<StaffUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState("");

  const [lockTarget, setLockTarget] = useState<StaffUser | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");

  // Credentials for Header Initials
  const [currentAdminName, setCurrentAdminName] = useState("Admin");
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");

  useEffect(() => {
    const admin = getUser();
    if (admin) {
      setCurrentAdminName(admin.FullName || admin.fullName || "Admin");
      setCurrentAdminEmail(admin.Email || admin.email || "admin@pickleclub.vn");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setUsers(await adminGetAllStaff(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await apiClient<ApiResponse<RoleOption[]>>("/api/admin/roles", { token });
      setAllRoles((res.data ?? []).filter((role) => role.Status === "Active"));
    } catch {
      setAllRoles([]);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [loadUsers, loadRoles]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchKeyword = `${user.FullName} ${user.Email || ""} ${user.PhoneNumber || ""}`
        .toLowerCase()
        .includes(keyword);
      const matchStatus = statusFilter === "All" || user.Status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [users, search, statusFilter]);

  function openEdit(user: StaffUser) {
    setEditTarget(user);
    setEditForm({
      fullName: user.FullName || "",
      phoneNumber: user.PhoneNumber || "",
    });
    setEditError("");
  }

  async function submitEdit() {
    if (!editTarget) return;

    setEditLoading(true);
    setEditError("");

    try {
      await adminUpdateUser(token, editTarget.UserID, {
        fullName: editForm.fullName.trim(),
        phoneNumber: editForm.phoneNumber.trim() || undefined,
      });
      setEditTarget(null);
      await loadUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Lỗi cập nhật thông tin nhân viên");
    } finally {
      setEditLoading(false);
    }
  }

  function openRoleAssign(user: StaffUser) {
    const currentRoles = splitRoles(user.Roles);
    const currentIds = allRoles
      .filter((role) => currentRoles.includes(role.RoleName))
      .map((role) => role.RoleID);

    setRoleTarget(user);
    setSelectedRoleIds(currentIds);
    setRoleError("");
  }

  function toggleRole(roleId: number) {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  }

  async function submitRoles() {
    if (!roleTarget) return;

    setRoleLoading(true);
    setRoleError("");

    try {
      await apiClient(`/api/admin/users/${roleTarget.UserID}/roles`, {
        method: "PUT",
        token,
        body: { roleIds: selectedRoleIds },
      });
      setRoleTarget(null);
      await loadUsers();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : "Lỗi cập nhật phân quyền");
    } finally {
      setRoleLoading(false);
    }
  }

  async function submitLock(isLocking: boolean) {
    if (!lockTarget) return;

    setLockLoading(true);
    setLockError("");

    try {
      const endpoint = isLocking
        ? `/api/admin/users/${lockTarget.UserID}/lock`
        : `/api/admin/users/${lockTarget.UserID}/unlock`;

      await apiClient(endpoint, {
        method: "POST",
        token,
        body: isLocking ? { reason: lockReason.trim() || undefined } : undefined,
      });
      setLockTarget(null);
      setLockReason("");
      await loadUsers();
    } catch (err) {
      setLockError(err instanceof Error ? err.message : "Lỗi thao tác tài khoản");
    } finally {
      setLockLoading(false);
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "ST";
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
            <span className={styles.currentCrumb}>Quản lý nhân viên</span>
          </div>

          <div className={styles.tabs} aria-label="Lọc trạng thái nhân viên">
            {[
              ["All", "Tất cả"],
              ["Active", "Hoạt động"],
              ["Locked", "Đã khóa"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`${styles.tab} ${statusFilter === value ? styles.tabActive : ""}`}
                onClick={() => setStatusFilter(value as StaffStatusFilter)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.searchBar}>
            <svg className={styles.searchIcon} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Mở ca trực */}
          <Link href="/staff/operations" className={styles.btnOperations}>
            Lịch Slot
          </Link>

          {/* Thêm nhân viên */}
          <button className={styles.btnCreate} onClick={() => setIsModalOpen(true)}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Thêm nhân viên
          </button>

          {/* Refresh Page */}
          <button className={styles.btnIcon} onClick={loadUsers} title="Tải lại dữ liệu">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          {/* Initials Avatar Admin */}
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
            <h1 className={styles.pageTitle}>Quản lý nhân viên</h1>
            <p className={styles.pageSub}>Quản lý tài khoản Staff, quyền hạn vai trò, và trạng thái hoạt động.</p>
          </div>
          {!loading && !error && (
            <span className={styles.countBadge}>{filtered.length} nhân viên</span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.errorBox}>
            <span>⚠️ Lỗi tải dữ liệu: {error}</span>
            <button className={styles.retryBtn} onClick={loadUsers} type="button">
              Thử lại
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className={styles.skeletonCardGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          <div className={styles.staffCardGrid}>
            {filtered.map((user) => {
              const roles = splitRoles(user.Roles);
              const isLocked = user.Status === "Locked";
              const sInitials = getInitials(user.FullName);
              const coverIndex = user.UserID % 5;

              return (
                <div key={user.UserID} className={styles.staffCard}>
                  {/* Banner cover with color shift */}
                  <div className={`${styles.cardCover} ${styles[`cover_${coverIndex}`]}`}>
                    {/* Avatar initials wrap */}
                    <div className={styles.playerAvatarWrap}>
                      <div className={styles.avatarCircle}>
                        {user.AvatarURL ? (
                          <img src={getImageUrl(user.AvatarURL)} alt={user.FullName} className={styles.coachAvatar} />
                        ) : (
                          <span>{sInitials}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.coachName}>{user.FullName}</h3>
                      <span className={styles.coachEmail}>{user.Email}</span>
                    </div>

                    <div className={styles.cardInfo}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Điện thoại:</span>
                        <span className={styles.infoVal}>{user.PhoneNumber || "—"}</span>
                      </div>
                      
                      {/* Roles list */}
                      <div className={styles.infoRow} style={{ alignItems: "flex-start" }}>
                        <span className={styles.infoLabel}>Vai trò:</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end", maxWidth: "160px" }}>
                          {roles.length > 0 ? (
                            roles.map((role) => {
                              const badgeStyle = 
                                role === "Admin" ? styles.badgeAdmin :
                                role === "Manager" ? styles.badgeManager :
                                role === "Coach" ? styles.badgeCoach :
                                styles.badgeStaff;
                              return (
                                <span key={role} className={`${styles.skillBadge} ${badgeStyle}`}>
                                  {ROLE_LABELS[role] || role}
                                </span>
                              );
                            })
                          ) : (
                            <span className={styles.tdMuted}>—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardStatusRow}>
                      <span
                        className={`${styles.statusBadge} ${
                          isLocked
                            ? styles.statusRejected
                            : user.Status === "Active"
                              ? styles.statusApproved
                              : styles.statusInactive
                        }`}
                      >
                        {STATUS_LABELS[user.Status] || user.Status}
                      </span>
                    </div>
                  </div>

                  {/* Card footer actions */}
                  <div className={styles.cardFooter}>
                    <button className={styles.btnApprove} onClick={() => setDetailTarget(user)} type="button">
                      Chi tiết
                    </button>
                    <button className={styles.btnApprove} onClick={() => openEdit(user)} type="button">
                      Sửa
                    </button>
                    <button
                      className={styles.btnInactive}
                      onClick={() => openRoleAssign(user)}
                      type="button"
                    >
                      Quyền
                    </button>
                    <button
                      className={isLocked ? styles.btnInactive : styles.btnReject}
                      onClick={() => {
                        setLockTarget(user);
                        setLockReason("");
                        setLockError("");
                      }}
                      type="button"
                    >
                      {isLocked ? "Mở" : "Khóa"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <StaffCreateModal
          token={token}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadUsers();
          }}
        />
      )}

      {detailTarget && (
        <StaffDetailModal user={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {editTarget && (
        <div className={styles.modalOverlay} onClick={() => setEditTarget(null)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalTitleRow}>
              <h2>Sửa thông tin nhân viên</h2>
              <button className={styles.modalCloseBtn} onClick={() => setEditTarget(null)} type="button">
                ×
              </button>
            </div>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label>Họ và tên *</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(event) => setEditForm((form) => ({ ...form, fullName: event.target.value }))}
                  placeholder="Nguyễn Văn A"
                  disabled={editLoading}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email đăng nhập</label>
                <input type="email" value={editTarget.Email || ""} disabled />
              </div>
              <div className={styles.formGroup}>
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(event) => setEditForm((form) => ({ ...form, phoneNumber: event.target.value }))}
                  placeholder="0901234567"
                  disabled={editLoading}
                />
              </div>
              {editError && <p className={styles.errorText}>{editError}</p>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setEditTarget(null)} disabled={editLoading} type="button">
                Hủy
              </button>
              <button
                className={styles.btnSubmit}
                onClick={submitEdit}
                disabled={editLoading || !editForm.fullName.trim()}
                type="button"
              >
                {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {roleTarget && (
        <div className={styles.modalOverlay} onClick={() => setRoleTarget(null)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className={styles.modalTitleRow}>
              <h2>Phân quyền - {roleTarget.FullName}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setRoleTarget(null)} type="button">
                ×
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Chọn các vai trò phù hợp với nhân viên này.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {allRoles.map((role) => (
                <label
                  key={role.RoleID}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    border: `1.5px solid ${selectedRoleIds.includes(role.RoleID) ? "#2563eb" : "#E5E7EB"}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    background: selectedRoleIds.includes(role.RoleID) ? "#F0FDF4" : "#fff",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.RoleID)}
                    onChange={() => toggleRole(role.RoleID)}
                    disabled={roleLoading}
                    style={{ accentColor: "#2563eb", width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                      {ROLE_LABELS[role.RoleName] || role.RoleName}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{role.RoleName}</div>
                  </div>
                </label>
              ))}
            </div>
            {roleError && <p className={styles.errorText}>{roleError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setRoleTarget(null)} disabled={roleLoading} type="button">
                Hủy
              </button>
              <button className={styles.btnSubmit} onClick={submitRoles} disabled={roleLoading || selectedRoleIds.length === 0} type="button">
                {roleLoading ? "Đang lưu..." : "Lưu phân quyền"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lockTarget && (
        <div className={styles.modalOverlay} onClick={() => setLockTarget(null)}>
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalTitleRow}>
              <h2>{lockTarget.Status === "Locked" ? "Mở khóa tài khoản" : "Khóa tài khoản"}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setLockTarget(null)} type="button">
                ×
              </button>
            </div>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 14 }}>
              {lockTarget.Status === "Locked"
                ? <>Xác nhận mở khóa <strong>{lockTarget.FullName}</strong>? Nhân viên có thể đăng nhập trở lại.</>
                : <>Khóa tài khoản <strong>{lockTarget.FullName}</strong> ({lockTarget.Email})</>}
            </p>
            {lockTarget.Status !== "Locked" && (
              <div className={styles.formGroup}>
                <label>Lý do khóa tài khoản *</label>
                <textarea
                  rows={3}
                  placeholder="Nhập lý do khóa tài khoản..."
                  value={lockReason}
                  onChange={(event) => setLockReason(event.target.value)}
                  disabled={lockLoading}
                  className={styles.formTextarea}
                />
              </div>
            )}
            {lockError && <p className={styles.errorText}>{lockError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setLockTarget(null)} disabled={lockLoading} type="button">
                Hủy
              </button>
              <button
                className={lockTarget.Status === "Locked" ? styles.btnSubmit : styles.btnReject}
                onClick={() => submitLock(lockTarget.Status !== "Locked")}
                disabled={lockLoading}
                type="button"
              >
                {lockLoading
                  ? "Đang xử lý..."
                  : lockTarget.Status === "Locked"
                    ? "Mở khóa"
                    : "Xác nhận khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffDetailModal({ user, onClose }: { user: StaffUser; onClose: () => void }) {
  const roles = splitRoles(user.Roles);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalTitleRow}>
          <h2>Chi tiết nhân viên</h2>
          <button className={styles.modalCloseBtn} onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className={styles.form} style={{ gap: 12 }}>
          <DetailRow label="Nhân viên" value={user.FullName} />
          <DetailRow label="Email" value={user.Email} />
          <DetailRow label="Số điện thoại" value={user.PhoneNumber || "—"} />
          <DetailRow label="Vai trò" value={roles.map((role) => ROLE_LABELS[role] || role).join(", ") || "—"} />
          <DetailRow label="Trạng thái" value={STATUS_LABELS[user.Status] || user.Status} />
          <DetailRow label="Ngày tạo" value={formatDate(user.CreatedAt)} />
          <DetailRow label="Cập nhật cuối" value={formatDate(user.UpdatedAt)} />
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnSubmit} onClick={onClose} type="button">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, fontSize: 13.5 }}>
      <strong style={{ color: "#64748b" }}>{label}:</strong>
      <span style={{ color: "#1e293b", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
