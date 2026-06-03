import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Review } from "@/types/review";

export async function getPublicReviews(): Promise<Review[]> {
  const response = await apiClient<ApiResponse<Review[]>>("/api/reviews");
  return response.data;
}
