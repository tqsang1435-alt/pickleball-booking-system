import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Coach } from "@/types/coach";

export async function getCoaches(): Promise<Coach[]> {
  const response = await apiClient<ApiResponse<Coach[]>>("/api/coaches");
  return response.data;
}

export async function getCoachById(id: number | string): Promise<Coach> {
  const response = await apiClient<ApiResponse<Coach>>(`/api/coaches/${id}`);
  return response.data;
}
