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
