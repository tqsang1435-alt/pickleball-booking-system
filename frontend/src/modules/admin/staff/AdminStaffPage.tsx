"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminGetAllStaff, adminUpdateUser } from "@/services/userApi";
import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import { getImageUrl } from "@/utils/image";
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
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý nhân viên</h1>
          <p className={styles.pageSub}>
            Admin/Manager quản lý tài khoản Staff, trạng thái và vai trò vận hành.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/staff/operations" className={styles.btnOperations}>
            Mở màn vận hành
          </Link>
          <button className={styles.btnCreate} onClick={() => setIsModalOpen(true)}>
            + Thêm nhân viên
          </button>
        </div>
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

      <div className={styles.toolBar}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={styles.searchInput}
          />
        </div>
        {!loading && !error && (
          <span className={styles.countBadge}>{filtered.length} nhân viên</span>
        )}
      </div>

      {error && (
        <div className={styles.errorBox}>
          <span>{error}</span>
          <button className={styles.retryBtn} onClick={loadUsers} type="button">
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>Không tìm thấy nhân viên nào</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const roles = splitRoles(user.Roles);
                const isLocked = user.Status === "Locked";

                return (
                  <tr key={user.UserID}>
                    <td>
                      <div className={styles.coachCell}>
                        <div className={styles.avatarCircle}>
                          {user.AvatarURL ? (
                            <img src={getImageUrl(user.AvatarURL)} alt={user.FullName} className={styles.coachAvatar} />
                          ) : (
                            <span>{user.FullName?.charAt(0)?.toUpperCase() ?? "?"}</span>
                          )}
                        </div>
                        <div>
                          <div className={styles.coachName}>{user.FullName}</div>
                          <div className={styles.coachEmail}>{user.Email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdMuted}>{user.PhoneNumber || "-"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {roles.length > 0 ? (
                          roles.map((role) => (
                            <span key={role} className={styles.skillBadge}>
                              {ROLE_LABELS[role] || role}
                            </span>
                          ))
                        ) : (
                          <span className={styles.tdMuted}>-</span>
                        )}
                      </div>
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnInactive} onClick={() => setDetailTarget(user)} type="button">
                          Chi tiết
                        </button>
                        <button className={styles.btnApprove} onClick={() => openEdit(user)} type="button">
                          Sửa
                        </button>
                        <button
                          className={styles.btnApprove}
                          style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}
                          onClick={() => openRoleAssign(user)}
                          type="button"
                        >
                          Phân quyền
                        </button>
                        <button
                          className={isLocked ? styles.btnApprove : styles.btnReject}
                          onClick={() => {
                            setLockTarget(user);
                            setLockReason("");
                            setLockError("");
                          }}
                          type="button"
                        >
                          {isLocked ? "Mở khóa" : "Khóa"}
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
          <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalTitleRow}>
              <h2>Phân quyền - {roleTarget.FullName}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setRoleTarget(null)} type="button">
                ×
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 16px" }}>
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
                    border: `1.5px solid ${selectedRoleIds.includes(role.RoleID) ? "var(--primary, #4CAF50)" : "#E5E7EB"}`,
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
                    style={{ accentColor: "var(--primary, #4CAF50)", width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {ROLE_LABELS[role.RoleName] || role.RoleName}
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{role.RoleName}</div>
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
                <label>Lý do khóa</label>
                <textarea
                  rows={3}
                  placeholder="Nhập lý do khóa tài khoản..."
                  value={lockReason}
                  onChange={(event) => setLockReason(event.target.value)}
                  disabled={lockLoading}
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
        <div className={styles.form}>
          <DetailRow label="Nhân viên" value={user.FullName} />
          <DetailRow label="Email" value={user.Email} />
          <DetailRow label="Số điện thoại" value={user.PhoneNumber || "-"} />
          <DetailRow label="Vai trò" value={roles.map((role) => ROLE_LABELS[role] || role).join(", ") || "-"} />
          <DetailRow label="Trạng thái" value={STATUS_LABELS[user.Status] || user.Status} />
          <DetailRow label="Ngày tạo" value={formatDate(user.CreatedAt)} />
          <DetailRow label="Cập nhật lần cuối" value={formatDate(user.UpdatedAt)} />
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
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, fontSize: 14 }}>
      <strong style={{ color: "#6B7280" }}>{label}</strong>
      <span style={{ color: "#111827" }}>{value}</span>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nhân viên</th>
            <th>Số điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, index) => (
            <tr key={index} className={styles.skeletonRow}>
              <td>
                <div className={styles.coachCell}>
                  <div className={styles.skeletonAvatar} />
                  <div>
                    <div className={styles.skeletonLine} style={{ width: 120 }} />
                    <div className={styles.skeletonLine} style={{ width: 160, marginTop: 6 }} />
                  </div>
                </div>
              </td>
              <td><div className={styles.skeletonLine} style={{ width: 90 }} /></td>
              <td><div className={styles.skeletonPill} /></td>
              <td><div className={styles.skeletonPill} /></td>
              <td><div className={styles.skeletonPill} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
