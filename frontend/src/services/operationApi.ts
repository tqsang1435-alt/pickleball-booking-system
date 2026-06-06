import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { TodayOperationsResponse, OperationBooking } from "@/types/operationTypes";

export async function getTodayOperations(token: string, date?: string): Promise<TodayOperationsResponse> {
  const url = date ? `/api/operations/today?date=${date}` : "/api/operations/today";
  const res = await apiClient<ApiResponse<TodayOperationsResponse>>(url, {
    token,
  });
  return res.data;
}

export async function checkInBooking(
  token: string,
  bookingId: number,
  note?: string
): Promise<{ bookingId: number; status: string; checkInTime: string }> {
  const res = await apiClient<ApiResponse<{ bookingId: number; status: string; checkInTime: string }>>(
    `/api/operations/bookings/${bookingId}/check-in`,
    {
      method: "PATCH",
      token,
      body: { note },
    }
  );
  return res.data;
}

export async function completeBooking(
  token: string,
  bookingId: number
): Promise<{ bookingId: number; status: string }> {
  const res = await apiClient<ApiResponse<{ bookingId: number; status: string }>>(
    `/api/operations/bookings/${bookingId}/complete`,
    {
      method: "PATCH",
      token,
    }
  );
  return res.data;
}

export async function markBookingNoShow(
  token: string,
  bookingId: number,
  note?: string
): Promise<{ bookingId: number; status: string }> {
  const res = await apiClient<ApiResponse<{ bookingId: number; status: string }>>(
    `/api/operations/bookings/${bookingId}/no-show`,
    {
      method: "PATCH",
      token,
      body: { note },
    }
  );
  return res.data;
}

import type { AuditLogItem } from "@/types/operationTypes";
export async function getBookingLogs(token: string, bookingId: number): Promise<AuditLogItem[]> {
  const res = await apiClient<ApiResponse<AuditLogItem[]>>(`/api/operations/bookings/${bookingId}/logs`, {
    token,
  });
  return res.data || [];
}
