"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/apiClient";
import { getToken, clearAuth } from "@/utils/authStorage";
import type { ApiResponse } from "@/types/api";
import styles from "./PermissionsManagement.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = {
  RoleID: number;
  RoleName: string;
  Description: string | null;
  Status: "Active" | "Inactive";
  CreatedAt: string | null;
};

type RoleOption = {
  roleId: number;
  roleName: string;
};

type UserRow = {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: "Active" | "Locked" | "Inactive";
  createdAt: string | null;
  roles: RoleOption[];
  lockReason?: string | null;
};

type UsersResponse = {
  items: UserRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type Tab = "roles" | "users" | "logs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authGuard(msg: string, router: ReturnType<typeof useRouter>) {
  if (
    msg.includes("Token không hợp lệ") ||
    msg.includes("hết hạn") ||
    msg.includes("chưa đăng nhập") ||
    msg.includes("401")
  ) {
    clearAuth();
    router.push("/login");
    return true;
  }
  return false;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PermissionsManagement() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("roles");

  // ── Roles state ──
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");

  // ── Edit Role modal ──
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState({ roleName: "", description: "", status: "Active" as "Active" | "Inactive" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // ── Create Role modal ──
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ roleName: "", description: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // ── Delete Role modal ──
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Users state ──
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  // ── Assign Role modal ──
  const [assignUser, setAssignUser] = useState<UserRow | null>(null);
  const [assignRoleId, setAssignRoleId] = useState<number | "">("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // ── Lock modal ──
  const [lockUser, setLockUser] = useState<UserRow | null>(null);
  const [lockReason, setLockReason] = useState("");
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");

  // ─── Fetch roles ─────────────────────────────────────────────────────────

  const fetchRoles = useCallback(async () => {
    const token = getToken();
    setRolesLoading(true);
    setRolesError("");
    try {
      const res = await apiClient<ApiResponse<Role[]>>("/api/admin/roles", { token });
      setRoles(res.data ?? []);
    } catch (e: any) {
      const msg = e.message ?? "Lỗi tải danh sách role";
      if (!authGuard(msg, router)) setRolesError(msg);
    } finally {
      setRolesLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // ─── Fetch users ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (page = 1, search = "") => {
    const token = getToken();
    setUsersLoading(true);
    setUsersError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      const res = await apiClient<ApiResponse<UsersResponse>>(
        `/api/admin/users?${params.toString()}`,
        { token }
      );
      setUsers(res.data?.items ?? []);
      setUserTotalPages(res.data?.pagination?.totalPages ?? 1);
      setUserTotal(res.data?.pagination?.total ?? 0);
    } catch (e: any) {
      const msg = e.message ?? "Lỗi tải danh sách user";
      if (!authGuard(msg, router)) setUsersError(msg);
    } finally {
      setUsersLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (tab === "users") fetchUsers(userPage, userSearch);
  }, [tab, userPage, fetchUsers]);

  // ─── Edit Role ────────────────────────────────────────────────────────────

  function openEdit(role: Role) {
    setEditRole(role);
    setEditForm({ roleName: role.RoleName, description: role.Description ?? "", status: role.Status });
    setEditError("");
  }

  async function submitEdit() {
    if (!editRole) return;
    setEditLoading(true);
    setEditError("");
    try {
      await apiClient(`/api/admin/roles/${editRole.RoleID}`, {
        method: "PUT",
        token: getToken(),
        body: {
          roleName: editForm.roleName,
          description: editForm.description || undefined,
          status: editForm.status,
        },
      });
      setEditRole(null);
      fetchRoles();
    } catch (e: any) {
      setEditError(e.message ?? "Lỗi cập nhật role");
    } finally {
      setEditLoading(false);
    }
  }

  // ─── Create Role ──────────────────────────────────────────────────────────

  async function submitCreate() {
    setCreateLoading(true);
    setCreateError("");
    try {
      await apiClient("/api/admin/roles", {
        method: "POST",
        token: getToken(),
        body: { roleName: createForm.roleName, description: createForm.description || undefined },
      });
      setShowCreate(false);
      setCreateForm({ roleName: "", description: "" });
      fetchRoles();
    } catch (e: any) {
      setCreateError(e.message ?? "Lỗi tạo role");
    } finally {
      setCreateLoading(false);
    }
  }

  // ─── Assign Role ──────────────────────────────────────────────────────────

  async function submitAssign() {
    if (!assignUser || assignRoleId === "") return;
    setAssignLoading(true);
    setAssignError("");
    try {
      await apiClient(`/api/admin/users/${assignUser.userId}/roles`, {
        method: "PUT",
        token: getToken(),
        body: { roleIds: [Number(assignRoleId)] },
      });
      setAssignUser(null);
      fetchUsers(userPage, userSearch);
    } catch (e: any) {
      setAssignError(e.message ?? "Lỗi gán role");
    } finally {
      setAssignLoading(false);
    }
  }

  // ─── Lock / Unlock ────────────────────────────────────────────────────────

  async function submitLock(isLocked: boolean) {
    if (!lockUser) return;
    setLockLoading(true);
    setLockError("");
    try {
      if (isLocked) {
        await apiClient(`/api/admin/users/${lockUser.userId}/lock`, {
          method: "POST",
          token: getToken(),
          body: {
            reason: lockReason || undefined,
          },
        });
      } else {
        await apiClient(`/api/admin/users/${lockUser.userId}/unlock`, {
          method: "POST",
          token: getToken(),
        });
      }
      setLockUser(null);
      setLockReason("");
      fetchUsers(userPage, userSearch);
    } catch (e: any) {
      setLockError(e.message ?? "Lỗi thao tác khóa/mở khóa");
    } finally {
      setLockLoading(false);
    }
  }

  // ─── Delete Role ──────────────────────────────────────────────────────────

  async function submitDelete() {
    if (!deleteRole) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await apiClient(`/api/admin/roles/${deleteRole.RoleID}`, {
        method: "DELETE",
        token: getToken(),
      });
      setDeleteRole(null);
      fetchRoles();
    } catch (e: any) {
      setDeleteError(e.message ?? "Lỗi xóa role");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ─── Search debounce ──────────────────────────────────────────────────────

  useEffect(() => {
    if (tab !== "users") return;
    const t = setTimeout(() => {
      setUserPage(1);
      fetchUsers(1, userSearch);
    }, 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Phân quyền</h1>
          <p>Quản lý vai trò, người dùng và nhật ký hoạt động</p>
        </div>
        <div className={styles.headerRight}>
          {tab === "roles" && (
            <button className={styles.btnPrimary} onClick={() => { setCreateForm({ roleName: "", description: "" }); setCreateError(""); setShowCreate(true); }}>
              + Tạo Role mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "roles" ? styles.tabActive : ""}`} onClick={() => setTab("roles")}>Vai trò</button>
        <button className={`${styles.tab} ${tab === "users" ? styles.tabActive : ""}`} onClick={() => setTab("users")}>Người dùng</button>
        <button className={`${styles.tab} ${tab === "logs" ? styles.tabActive : ""}`} onClick={() => setTab("logs")}>Nhật ký</button>
      </div>

      {/* ══ TAB: ROLES ══ */}
      {tab === "roles" && (
        <>
          <div className={styles.toolbar}>
            <span />
            {!rolesLoading && !rolesError && (
              <span className={styles.countBadge}>{roles.length} vai trò</span>
            )}
          </div>

          {rolesError && <div className={styles.errorBox}>{rolesError}</div>}

          <div className={styles.panel}>
            {!rolesLoading && (
              <div className={`${styles.tableHead} ${styles.tableHeadRoles}`}>
                <span>#</span>
                <span>Tên Role</span>
                <span>Mô tả</span>
                <span>Trạng thái</span>
                <span>Ngày tạo</span>
                <span>Thao tác</span>
              </div>
            )}

            {rolesLoading && (
              <>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</>
            )}

            {!rolesLoading && !rolesError && roles.length === 0 && (
              <div className={styles.empty}>Không có vai trò nào</div>
            )}

            {!rolesLoading && !rolesError && roles.map((role) => (
              <div key={role.RoleID} className={`${styles.tableRow} ${styles.tableRowRoles}`}>
                <span className={styles.colId}>{role.RoleID}</span>
                <span className={styles.colName}>{role.RoleName}</span>
                <span className={styles.colDesc}>{role.Description ?? "—"}</span>
                <StatusBadge status={role.Status} />
                <span className={styles.colDate}>{fmtDate(role.CreatedAt)}</span>
                <div className={styles.colActions}>
                  <button className={styles.btnEdit} onClick={() => openEdit(role)}>✏️ Sửa</button>
                  <button
                    className={styles.btnDelete}
                    onClick={() => { setDeleteRole(role); setDeleteError(""); }}
                  >🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══ TAB: USERS ══ */}
      {tab === "users" && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Tìm theo tên, email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            {!usersLoading && !usersError && (
              <span className={styles.countBadge}>{userTotal} người dùng</span>
            )}
          </div>

          {usersError && <div className={styles.errorBox}>{usersError}</div>}

          <div className={styles.tableWrap}>
            {usersLoading ? (
              <div className={styles.stateBox}>
                <div className={styles.spinner} />
                <span>Đang tải danh sách...</span>
              </div>
            ) : !usersError && users.length === 0 ? (
              <div className={styles.stateBox}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Không tìm thấy người dùng nào</span>
              </div>
            ) : !usersError ? (
              <table className={styles.userTable}>
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Số điện thoại</th>
                    <th>Quyền</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.userName}>{u.fullName}</div>
                            <div className={styles.userEmail}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.tdMuted}>{u.phoneNumber ?? "—"}</td>
                      <td>
                        <div className={styles.roleTagList}>
                          {u.roles && u.roles.length > 0
                            ? u.roles.map(r => <span key={r.roleId} className={styles.roleTag}>{r.roleName}</span>)
                            : <span className={styles.tdMuted}>—</span>
                          }
                        </div>
                      </td>
                      <td><UserStatusBadge status={u.status} /></td>
                      <td className={styles.tdMuted}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.btnAssign}
                            onClick={() => { setAssignUser(u); setAssignRoleId(""); setAssignError(""); }}
                          >
                            Gán quyền
                          </button>
                          {u.status === "Locked" ? (
                            <button
                              className={styles.btnUnlock}
                              onClick={() => { setLockUser(u); setLockReason(""); setLockError(""); }}
                            >
                              Mở khóa
                            </button>
                          ) : (
                            <button
                              className={styles.btnLock}
                              onClick={() => { setLockUser(u); setLockReason(""); setLockError(""); }}
                            >
                              Khóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>

          {/* Pagination */}
          {!usersLoading && userTotalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={userPage <= 1}
                onClick={() => setUserPage(p => p - 1)}
              >← Trước</button>
              <span className={styles.pageInfo}>Trang {userPage} / {userTotalPages}</span>
              <button
                className={styles.pageBtn}
                disabled={userPage >= userTotalPages}
                onClick={() => setUserPage(p => p + 1)}
              >Sau →</button>
            </div>
          )}
        </>
      )}

      {/* ══ TAB: LOGS ══ */}
      {tab === "logs" && (
        <div className={styles.panel}>
          <div className={styles.logsEmpty}>
            <span className={styles.logsIcon}>📋</span>
            <span>Nhật ký hoạt động đang được phát triển</span>
          </div>
        </div>
      )}

      {/* ══ MODAL: Edit Role ══ */}
      {editRole && (
        <div className={styles.overlay} onClick={() => setEditRole(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chỉnh sửa Role</h2>
              <button className={styles.modalClose} onClick={() => setEditRole(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {editError && <div className={styles.modalError}>{editError}</div>}
              <div className={styles.formGroup}>
                <label>Tên Role</label>
                <input
                  value={editForm.roleName}
                  onChange={e => setEditForm(f => ({ ...f, roleName: e.target.value }))}
                  placeholder="Ví dụ: Admin"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mô tả</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả vai trò này..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as "Active" | "Inactive" }))}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setEditRole(null)}>Hủy</button>
              <button className={styles.btnSave} onClick={submitEdit} disabled={editLoading}>
                {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Create Role ══ */}
      {showCreate && (
        <div className={styles.overlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Tạo Role mới</h2>
              <button className={styles.modalClose} onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {createError && <div className={styles.modalError}>{createError}</div>}
              <div className={styles.formGroup}>
                <label>Tên Role *</label>
                <input
                  value={createForm.roleName}
                  onChange={e => setCreateForm(f => ({ ...f, roleName: e.target.value }))}
                  placeholder="Ví dụ: Moderator"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mô tả</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả vai trò này..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowCreate(false)}>Hủy</button>
              <button className={styles.btnSave} onClick={submitCreate} disabled={createLoading || !createForm.roleName.trim()}>
                {createLoading ? "Đang tạo..." : "Tạo Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Assign Role ══ */}
      {assignUser && (
        <div className={styles.overlay} onClick={() => setAssignUser(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Gán Role cho {assignUser.fullName}</h2>
              <button className={styles.modalClose} onClick={() => setAssignUser(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {assignError && <div className={styles.modalError}>{assignError}</div>}
              <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                Role hiện tại: {assignUser.roles?.map(r => r.roleName).join(", ") || "Chưa có role"}
              </p>
              <div className={styles.formGroup}>
                <label>Chọn Role cần gán</label>
                <select
                  value={assignRoleId}
                  onChange={e => setAssignRoleId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">-- Chọn role --</option>
                  {roles.filter(r => r.Status === "Active").map(r => (
                    <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>
                  ))}
                </select>
                <span className={styles.formHint}>Một tài khoản tối đa 2 role</span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setAssignUser(null)}>Hủy</button>
              <button className={styles.btnSave} onClick={submitAssign} disabled={assignLoading || assignRoleId === ""}>
                {assignLoading ? "Đang gán..." : "Gán Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Lock / Unlock ══ */}
      {lockUser && (
        <div className={styles.overlay} onClick={() => setLockUser(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{lockUser.status === "Locked" ? "Mở khóa tài khoản" : "Khóa tài khoản"}</h2>
              <button className={styles.modalClose} onClick={() => setLockUser(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {lockError && <div className={styles.modalError}>{lockError}</div>}
              <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>
                {lockUser.status === "Locked"
                  ? <>Xác nhận mở khóa tài khoản <strong>{lockUser.fullName}</strong>?</>
                  : <>Khóa tài khoản <strong>{lockUser.fullName}</strong> ({lockUser.email})</>
                }
              </p>
              {lockUser.status !== "Locked" && (
                <div className={styles.formGroup}>
                  <label>Lý do khóa *</label>
                  <textarea
                    value={lockReason}
                    onChange={e => setLockReason(e.target.value)}
                    placeholder="Nhập lý do khóa tài khoản (ít nhất 5 ký tự)..."
                  />
                </div>
              )}
              {lockUser.status === "Locked" && lockUser.lockReason && (
                <div style={{ fontSize: 13, color: "#6B7280", background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                  Lý do khóa: {lockUser.lockReason}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setLockUser(null)}>Hủy</button>
              {lockUser.status === "Locked" ? (
                <button className={styles.btnSave} onClick={() => submitLock(false)} disabled={lockLoading}>
                  {lockLoading ? "Đang xử lý..." : "Mở khóa"}
                </button>
              ) : (
                <button
                  className={styles.btnDanger}
                  onClick={() => submitLock(true)}
                  disabled={lockLoading || lockReason.trim().length < 5}
                >
                  {lockLoading ? "Đang khóa..." : "Xác nhận khóa"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Delete Role ══ */}
      {deleteRole && (
        <div className={styles.overlay} onClick={() => setDeleteRole(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Xóa Role</h2>
              <button className={styles.modalClose} onClick={() => setDeleteRole(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {deleteError && <div className={styles.modalError}>{deleteError}</div>}
              <div style={{
                display: "flex", flexDirection: "column", gap: 12,
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 12, padding: "16px 18px"
              }}>
                <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>
                  Bạn chắc chắn muốn xóa role <strong>{deleteRole.RoleName}</strong>?
                </p>
                <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                  Hành động này không thể hoàn tác. Role sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </p>
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", background: "#F9FAFB", borderRadius: 8, padding: "10px 14px" }}>
                ⚠️ Không thể xóa các role hệ thống (Admin, Manager, Staff, Coach, Player, Guest)
                hoặc role đang có người dùng.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setDeleteRole(null)}>Hủy</button>
              <button
                className={styles.btnDanger}
                onClick={submitDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Đang xóa..." : "Xóa Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "Active" | "Inactive" }) {
  if (status === "Active") {
    return (
      <span className={styles.statusActive}>
        <span className={`${styles.dot} ${styles.dotGreen}`} />
        Hoạt động
      </span>
    );
  }
  return (
    <span className={styles.statusInactive}>
      <span className={`${styles.dot} ${styles.dotGray}`} />
      Không hoạt động
    </span>
  );
}

function UserStatusBadge({ status }: { status: "Active" | "Locked" | "Inactive" }) {
  if (status === "Locked") {
    return (
      <span className={styles.statusLocked}>
        <span className={`${styles.dot} ${styles.dotRed}`} />
        Đã khóa
      </span>
    );
  }
  if (status === "Active") {
    return (
      <span className={styles.statusActive}>
        <span className={`${styles.dot} ${styles.dotGreen}`} />
        Hoạt động
      </span>
    );
  }
  return (
    <span className={styles.statusInactive}>
      <span className={`${styles.dot} ${styles.dotGray}`} />
      Không hoạt động
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonCircle} />
      <div className={styles.skeletonLines}>
        <div className={styles.skeletonLine} style={{ width: "30%" }} />
        <div className={styles.skeletonLine} style={{ width: "55%" }} />
      </div>
      <div className={styles.skeletonPill} />
    </div>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}
