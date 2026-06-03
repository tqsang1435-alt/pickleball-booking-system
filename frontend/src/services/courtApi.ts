import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Court } from "@/types/court";

export async function getCourts(): Promise<Court[]> {
  const response = await apiClient<ApiResponse<Court[]>>("/api/courts");
  return response.data;
}

export async function getCourtById(id: number | string): Promise<Court> {
  const response = await apiClient<ApiResponse<Court>>(`/api/courts/${id}`);
  return response.data;
}

export async function createCourt(token: string, payload: Omit<Court, "CourtID"> | FormData): Promise<Court> {
  const response = await apiClient<ApiResponse<Court>>("/api/courts", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

export async function updateCourt(token: string, id: number, payload: Partial<Court> | FormData): Promise<Court> {
  const response = await apiClient<ApiResponse<Court>>(`/api/courts/${id}`, {
    method: "PUT",
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteCourt(token: string, id: number): Promise<{ CourtID: number; Status: string }> {
  const response = await apiClient<ApiResponse<{ CourtID: number; Status: string }>>(`/api/courts/${id}`, {
    method: "DELETE",
    token,
  });
  return response.data;
}

export type CourtSlot = {
  SlotID: number;
  CourtID: number;
  SlotDate: string;
  StartTime: string;
  EndTime: string;
  Price: number;
  Status: "Available" | "Blocked" | "Booked" | "Holding" | "Maintenance" | string;
};

export async function getCourtSlots(
  courtId: number,
  slotDate: string
): Promise<CourtSlot[]> {
  const response = await apiClient<ApiResponse<CourtSlot[]>>(
    `/api/courts/slots?courtId=${courtId}&slotDate=${slotDate}`
  );
  return response.data;
}

export async function createSlot(
  token: string,
  payload: { courtId: number; slotDate: string; startTime: string; endTime: string; price: number }
): Promise<CourtSlot> {
  const response = await apiClient<ApiResponse<CourtSlot>>("/api/courts/slots", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

export async function updateSlotStatus(
  token: string,
  slotId: number,
  status: string
): Promise<CourtSlot> {
  const response = await apiClient<ApiResponse<CourtSlot>>(
    `/api/courts/slots/${slotId}`,
    { method: "PUT", token, body: { status } }
  );
  return response.data;
}

export async function deleteSlot(
  token: string,
  slotId: number
): Promise<{ SlotID: number }> {
  const response = await apiClient<ApiResponse<{ SlotID: number }>>(
    `/api/courts/slots/${slotId}`,
    { method: "DELETE", token }
  );
  return response.data;
}

/**
 * UC-62: Sinh slot hàng loạt từ giờ mở đến giờ đóng cửa của sân.
 */
export async function generateSlots(
  token: string,
  payload: {
    courtId: number;
    slotDate: string;
    durationMinutes: number;
    price: number;
  }
): Promise<{ total: number; created: number; skipped: number }> {
  const response = await apiClient<
    ApiResponse<{ total: number; created: number; skipped: number }>
  >("/api/courts/slots/generate", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

export async function getAvailableCourts(
  bookingDate: string,
  startTime: string,
  endTime: string
): Promise<any[]> {
  const response = await apiClient<ApiResponse<any[]>>(
    `/api/courts/available?bookingDate=${bookingDate}&startTime=${startTime}&endTime=${endTime}`
  );
  return response.data;
}
