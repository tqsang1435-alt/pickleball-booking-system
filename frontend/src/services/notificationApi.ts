import { apiClient } from "./apiClient";
import type { ApiResponse } from "@/types/api";
import type { NotificationItem } from "@/types/operationTypes"; // We will add it to types or create a new type file

export async function getMyNotifications(token: string, limit: number = 50): Promise<NotificationItem[]> {
  const res = await apiClient<ApiResponse<NotificationItem[]>>(`/api/notifications?limit=${limit}`, { token });
  return res.data || [];
}

export async function getUnreadNotificationCount(token: string): Promise<number> {
  const res = await apiClient<ApiResponse<number>>(`/api/notifications/unread-count`, { token });
  return res.data || 0;
}

export async function markNotificationAsRead(token: string, id: number): Promise<void> {
  await apiClient(`/api/notifications/${id}/read`, { method: "PATCH", token });
}

export async function markAllNotificationsAsRead(token: string): Promise<void> {
  await apiClient(`/api/notifications/read-all`, { method: "PATCH", token });
}
