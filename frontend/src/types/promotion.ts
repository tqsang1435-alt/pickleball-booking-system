// ==========================================
// types/promotion.ts – Full promotion types
// ==========================================

export type DiscountType = "Percent" | "Fixed";
export type ApplyScope = "Public" | "Private";
export type PromotionStatus = "Active" | "Inactive" | "Expired";

export interface Promotion {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minBookingAmount?: number;
  startDate?: string;
  endDate?: string;
  applyScope?: ApplyScope;
  status: PromotionStatus;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number;
  createdAt?: string;
}

// Response từ /api/promotions/validate và /api/promotions/apply
export interface PromotionValidateResult {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  discountType: DiscountType;
  discountValue: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface PromotionApplyResult {
  bookingId: number;
  promotionId: number;
  promotionCode: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

// Admin types
export interface AdminPromotion {
  PromotionID: number;
  PromotionCode: string;
  PromotionName: string;
  Description?: string;
  DiscountType: DiscountType;
  DiscountValue: number;
  MaxDiscountAmount?: number | null;
  MinOrderAmount: number;
  UsageLimit?: number | null;
  UsedCount: number;
  PerUserLimit: number;
  ApplyScope: ApplyScope;
  StartDate: string;
  EndDate: string;
  Status: PromotionStatus;
  CreatedBy?: number;
  CreatedAt: string;
  UpdatedAt?: string;
}

export interface PromotionUser {
  UserPromotionID: number;
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber?: string;
  Status: string;
  AssignedAt: string;
  UsedAt?: string | null;
}

export interface CreatePromotionPayload {
  promotionCode: string;
  promotionName: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minBookingAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  perUserLimit?: number;
  applyScope: ApplyScope;
  status?: PromotionStatus;
  userIds?: number[];
}

export interface UpdatePromotionPayload {
  promotionName?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minBookingAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number | null;
  perUserLimit?: number;
  applyScope?: ApplyScope;
  status?: PromotionStatus;
}

export interface UserSearchResult {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber?: string;
  Status: string;
  RoleName?: string;
}