"use client";

import { useState, useEffect } from "react";
import UserTable from "./components/UserTable";
import RoleAssignModal from "./components/RoleAssignModal";
import LockAccountModal from "./components/LockAccountModal";
import { useUserManagement } from "./hooks/useUserManagement";
import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { ApiResponse } from "@/types/api";
import type { AdminUserItem, RoleOption } from "@/types/admin-user.types";

export type UserRow = AdminUserItem;

export default function UserManagement() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [filterLocked, setFilterLocked] = useState<"" | "true" | "false">("");
    const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
    const [lockTarget, setLockTarget] = useState<UserRow | null>(null);

    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isLocking, setIsLocking] = useState(false);

    const { users, total, totalPages, isLoading, error, refetch } = useUserManagement({
        search, page, isLocked: filterLocked || undefined,
    });

    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            try {
                const token = getToken();
                const res = await apiClient<ApiResponse<RoleOption[]>>("/api/admin/roles", { token });
                setRoles(res.data ?? []);
            } catch (err) {
                console.error("Lỗi tải danh sách role", err);
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    const handleAssignSubmit = async (userId: number, roleIds: number[]) => {
        setIsAssigning(true);
        try {
            await apiClient(`/api/admin/users/${userId}/roles`, {
                method: "PUT",
                token: getToken(),
                body: { roleIds },
            });
            setRoleTarget(null);
            refetch();
        } catch (err: any) {
            alert(err.message ?? "Lỗi gán quyền");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleLock = async (userId: number, reason?: string) => {
        setIsLocking(true);
        try {
            await apiClient(`/api/admin/users/${userId}/lock`, {
                method: "POST",
                token: getToken(),
                body: { reason },
            });
            setLockTarget(null);
            refetch();
        } catch (err: any) {
            alert(err.message ?? "Lỗi khóa tài khoản");
        } finally {
            setIsLocking(false);
        }
    };

    const handleUnlock = async (userId: number) => {
        setIsLocking(true);
        try {
            await apiClient(`/api/admin/users/${userId}/unlock`, {
                method: "POST",
                token: getToken(),
            });
            setLockTarget(null);
            refetch();
        } catch (err: any) {
            alert(err.message ?? "Lỗi mở khóa tài khoản");
        } finally {
            setIsLocking(false);
        }
    };

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-medium">Quản lý tài khoản</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Phân quyền và khóa tài khoản người dùng</p>
                </div>
                <span className="text-sm text-gray-400">{total} tài khoản</span>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative">
                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm theo email hoặc tên..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filterLocked}
                    onChange={e => { setFilterLocked(e.target.value as any); setPage(1); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="false">Đang hoạt động</option>
                    <option value="true">Đã bị khóa</option>
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 flex items-center gap-2 transition-all">
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button onClick={() => refetch()} className="ml-auto font-semibold hover:underline">Thử lại</button>
                </div>
            )}

            {/* Table */}
            <UserTable
                users={users}
                loading={isLoading}
                onAssignRoles={u => setRoleTarget(u)}
                onChangeStatus={u => setLockTarget(u)}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <span className="text-sm text-slate-500">
                        Hiển thị trang <strong className="text-slate-800 font-semibold">{page}</strong> trên tổng số <strong className="text-slate-800 font-semibold">{totalPages}</strong> trang
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                        >
                            ‹
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            const isActive = pageNum === page;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {roleTarget && (
                <RoleAssignModal
                    user={roleTarget}
                    roles={roles}
                    loading={isAssigning}
                    onClose={() => setRoleTarget(null)}
                    onSubmit={handleAssignSubmit}
                />
            )}
            {lockTarget && (
                <LockAccountModal
                    user={lockTarget}
                    loading={isLocking}
                    onClose={() => setLockTarget(null)}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                />
            )}
        </div>
    );
}