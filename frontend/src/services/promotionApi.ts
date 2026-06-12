// ==========================================
// services/promotionApi.ts – Promotion API
// ==========================================

import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type {
  Promotion,
  AdminPromotion,
  PromotionValidateResult,
  PromotionApplyResult,
  PromotionUser,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  UserSearchResult,
} from "@/types/promotion";

// ── User APIs ─────────────────────────────────────────────────────────────────

export async function getMyPromotions(
  token: string,
  bookingAmount?: number
): Promise<Promotion[]> {
  const qs = bookingAmount ? `?bookingAmount=${bookingAmount}` : "";
  const res = await apiClient<ApiResponse<Promotion[]>>(
    `/api/promotions/my${qs}`,
    { token }
  );
  return res.data;
}

export async function validatePromotion(
  token: string,
  promotionCode: string,
  bookingId: number
): Promise<PromotionValidateResult> {
  const res = await apiClient<ApiResponse<PromotionValidateResult>>(
    "/api/promotions/validate",
    { method: "POST", token, body: { promotionCode, bookingId } }
  );
  return res.data;
}

export async function applyPromotion(
  token: string,
  bookingId: number,
  promotionCode: string
): Promise<PromotionApplyResult> {
  const res = await apiClient<ApiResponse<PromotionApplyResult>>(
    "/api/promotions/apply",
    { method: "POST", token, body: { bookingId, promotionCode } }
  );
  return res.data;
}

export async function removePromotion(
  token: string,
  bookingId: number
): Promise<void> {
  await apiClient<ApiResponse<unknown>>("/api/promotions/remove", {
    method: "DELETE",
    token,
    body: { bookingId },
  });
}

export async function getPublicPromotions(): Promise<Promotion[]> {
  const res = await apiClient<ApiResponse<Promotion[]>>("/api/promotions");
  return res.data;
}

// ── Admin APIs ────────────────────────────────────────────────────────────────

export async function getAdminPromotions(
  token: string,
  filters?: {
    status?: string;
    applyScope?: string;
    discountType?: string;
    keyword?: string;
  }
): Promise<AdminPromotion[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.applyScope) params.set("applyScope", filters.applyScope);
  if (filters?.discountType) params.set("discountType", filters.discountType);
  if (filters?.keyword) params.set("keyword", filters.keyword);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await apiClient<ApiResponse<AdminPromotion[]>>(
    `/api/admin/promotions${qs}`,
    { token }
  );
  return res.data;
}

export async function getPromotionDetail(
  token: string,
  id: number
): Promise<AdminPromotion> {
  const res = await apiClient<ApiResponse<AdminPromotion>>(
    `/api/admin/promotions/${id}`,
    { token }
  );
  return res.data;
}

export async function createPromotion(
  token: string,
  payload: CreatePromotionPayload
): Promise<{ promotionId: number }> {
  const res = await apiClient<ApiResponse<{ promotionId: number }>>(
    "/api/admin/promotions",
    { method: "POST", token, body: payload }
  );
  return res.data;
}

export async function updatePromotion(
  token: string,
  id: number,
  payload: UpdatePromotionPayload
): Promise<AdminPromotion> {
  const res = await apiClient<ApiResponse<AdminPromotion>>(
    `/api/admin/promotions/${id}`,
    { method: "PUT", token, body: payload }
  );
  return res.data;
}

export async function updatePromotionStatus(
  token: string,
  id: number,
  status: string
): Promise<void> {
  await apiClient<ApiResponse<unknown>>(
    `/api/admin/promotions/${id}/status`,
    { method: "PATCH", token, body: { status } }
  );
}

export async function assignUsersToPromotion(
  token: string,
  id: number,
  userIds: number[]
): Promise<void> {
  await apiClient<ApiResponse<unknown>>(
    `/api/admin/promotions/${id}/users`,
    { method: "POST", token, body: { userIds } }
  );
}

export async function revokeUserPromotion(
  token: string,
  promotionId: number,
  userId: number
): Promise<void> {
  await apiClient<ApiResponse<unknown>>(
    `/api/admin/promotions/${promotionId}/users/${userId}`,
    { method: "DELETE", token }
  );
}

export async function getPromotionUsers(
  token: string,
  promotionId: number
): Promise<PromotionUser[]> {
  const res = await apiClient<ApiResponse<PromotionUser[]>>(
    `/api/admin/promotions/${promotionId}/users`,
    { token }
  );
  return res.data;
}

export async function searchUsers(
  token: string,
  keyword: string
): Promise<UserSearchResult[]> {
  const res = await apiClient<ApiResponse<UserSearchResult[]>>(
    `/api/admin/users/search?keyword=${encodeURIComponent(keyword)}`,
    { token }
  );
  return res.data;
}