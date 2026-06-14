"use client";

import type {
  AdminUserItem,
} from "@/types/admin-user.types";

interface UserTableProps {
  users: AdminUserItem[];
  loading: boolean;

  onAssignRoles: (
    user: AdminUserItem
  ) => void;

  onChangeStatus: (
    user: AdminUserItem
  ) => void;
}

export default function UserTable({
  users,
  loading,
  onAssignRoles,
  onChangeStatus,
}: UserTableProps) {
  if (loading) {
    return <SkeletonTable />;
  }

  if (users.length === 0) {
    return (
      <div className="py-16 text-center border border-slate-100 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center">
        <div className="h-12 w-12 text-slate-300 mb-3 flex items-center justify-center bg-slate-50 rounded-full text-lg">
          🔍
        </div>
        <p className="font-medium text-slate-700">Không tìm thấy người dùng phù hợp</p>
        <p className="mt-1 text-sm text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm overflow-x-auto">
      <table className="min-w-[1000px] w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 font-semibold">
              Người dùng
            </th>

            <th className="px-6 py-4 font-semibold">
              Số điện thoại
            </th>

            <th className="px-6 py-4 font-semibold">
              Quyền
            </th>

            <th className="px-6 py-4 font-semibold">
              Trạng thái
            </th>

            <th className="px-6 py-4 font-semibold">
              Ngày tạo
            </th>

            <th className="px-6 py-4 text-right font-semibold">
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr
              key={user.userId}
              className="hover:bg-slate-50/50 transition-colors"
            >
              <td className="px-6 py-4">
                <p className="font-medium text-slate-900">
                  {user.fullName}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {user.email}
                </p>
              </td>

              <td className="px-6 py-4 text-slate-600">
                {user.phoneNumber ?? "—"}
              </td>

              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.roleId}
                        className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                      >
                        {role.roleName}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </td>

              <td className="px-6 py-4">
                <StatusBadge
                  status={user.status}
                />
              </td>

              <td className="px-6 py-4 text-slate-600">
                {user.createdAt
                  ? new Date(
                      user.createdAt
                    ).toLocaleDateString(
                      "vi-VN"
                    )
                  : "—"}
              </td>

              <td className="px-6 py-4">
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onAssignRoles(user)
                    }
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    Gán quyền
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeStatus(user)
                    }
                    className={
                      user.status === "Locked"
                        ? "rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                        : "rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                    }
                  >
                    {user.status === "Locked"
                      ? "Mở khóa"
                      : "Khóa"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Hoạt động
      </span>
    );
  }
  if (status === "Locked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-100">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Đã khóa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-100">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Không hoạt động
    </span>
  );
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm overflow-x-auto">
      <table className="min-w-[1000px] w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 font-semibold">Người dùng</th>
            <th className="px-6 py-4 font-semibold">Số điện thoại</th>
            <th className="px-6 py-4 font-semibold">Quyền</th>
            <th className="px-6 py-4 font-semibold">Trạng thái</th>
            <th className="px-6 py-4 font-semibold">Ngày tạo</th>
            <th className="px-6 py-4 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx} className="animate-pulse">
              <td className="px-6 py-4">
                <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-48 bg-slate-150 rounded" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </td>
              <td className="px-6 py-4">
                <div className="h-5 w-16 bg-slate-200 rounded-lg" />
              </td>
              <td className="px-6 py-4">
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-2.5">
                  <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                  <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}