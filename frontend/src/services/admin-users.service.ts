import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type {
  AdminUserItem,
  ApiSuccessResponse,
  PaginatedAdminUsers,
  RoleOption,
  UserListFilters,
} from "@/types/admin-user.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(result?.message ?? "Yêu cầu thất bại");
  }

  return (result as ApiSuccessResponse<T>).data;
}

export async function getAdminUsers(filters: UserListFilters): Promise<PaginatedAdminUsers> {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.roleName) params.set("roleName", filters.roleName);

  const result = await apiClient<ApiSuccessResponse<PaginatedAdminUsers>>(
    `/api/admin/users?${params.toString()}`,
    { token: getToken() }
  );
  return result.data;
}

export async function getAvailableRoles(): Promise<RoleOption[]> {
  const result = await apiClient<ApiSuccessResponse<RoleOption[]>>(
    "/api/admin/roles",
    { token: getToken() }
  );
  return result.data;
}

export async function updateUserRoles(userId: number, roleIds: number[]): Promise<AdminUserItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/roles`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ roleIds }),
  });
  return parseResponse<AdminUserItem>(response);
}

export async function lockUserAccount(userId: number, reason?: string): Promise<AdminUserItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ reason }),
  });
  return parseResponse<AdminUserItem>(response);
}

export async function unlockUserAccount(userId: number): Promise<AdminUserItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unlock`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return parseResponse<AdminUserItem>(response);
}