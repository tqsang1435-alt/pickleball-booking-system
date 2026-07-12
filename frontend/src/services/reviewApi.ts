import { apiClient } from "./apiClient";
import { ReviewPaginationResponse, CreateReviewData, Review } from "@/types/review";
import { ApiResponse } from "@/types/api";

export const reviewApi = {
  getPublicReviews: async () => {
    const res = await apiClient<ApiResponse<Review[]>>("/api/reviews");
    return res.data;
  },

  getCoachReviews: async (coachId: number, page: number = 1, limit: number = 10) => {
    const res = await apiClient<ApiResponse<ReviewPaginationResponse>>(
      `/api/coaches/${coachId}/reviews?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getCourtReviews: async (courtId: number, page: number = 1, limit: number = 10) => {
    const res = await apiClient<ApiResponse<ReviewPaginationResponse>>(
      `/api/courts/${courtId}/reviews?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getClubReviews: async (page: number = 1, limit: number = 10) => {
    const res = await apiClient<ApiResponse<ReviewPaginationResponse>>(
      `/api/reviews/club?page=${page}&limit=${limit}`
    );
    return res.data;
  },

  getMyReviews: async (page: number = 1, limit: number = 10, token?: string) => {
    const res = await apiClient<ApiResponse<ReviewPaginationResponse>>(
      `/api/reviews/me?page=${page}&limit=${limit}`,
      { token }
    );
    return res.data;
  },

  createReview: async (data: CreateReviewData, token?: string) => {
    const res = await apiClient<ApiResponse<any>>("/api/reviews/create", {
      method: "POST",
      body: data,
      token,
    });
    return res.data;
  },

  checkEligibility: async (params: { courtId?: number; coachId?: number }, token?: string) => {
    const query = new URLSearchParams();
    if (params.courtId) query.append("courtId", String(params.courtId));
    if (params.coachId) query.append("coachId", String(params.coachId));
    
    const res = await apiClient<ApiResponse<{ canReview: boolean; bookingId?: number }>>(
      `/api/reviews/check-eligibility?${query.toString()}`,
      { token }
    );
    return res.data;
  },
};
