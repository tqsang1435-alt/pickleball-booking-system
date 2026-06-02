import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Promotion } from "@/types/promotion";

export async function getPromotions(): Promise<Promotion[]> {
  const response = await apiClient<ApiResponse<Promotion[]>>("/api/promotions");
  return response.data;
}