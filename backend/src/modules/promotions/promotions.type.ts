// ==========================================
// promotions.type.ts
// Types for Voucher / Promotion module
// ==========================================

export type DiscountType = "Percent" | "Fixed";
export type ApplyScope = "Public" | "Private";
export type PromotionStatus = "Active" | "Inactive" | "Expired";
export type UserPromotionStatus = "Assigned" | "Used" | "Revoked" | "Expired";
export type PromotionUsageStatus = "Reserved" | "Used" | "Released" | "Cancelled";

// ── DB Models ────────────────────────────────────────────────────────────────

export interface Promotion {
  PromotionID: number;
  PromotionCode: string;
  PromotionName: string;
  Description?: string;
  DiscountType: DiscountType;
  DiscountValue: number;
  MaxDiscountAmount?: number | null;
  MinOrderAmount: number;   // column name in DB
  UsageLimit?: number | null;
  UsedCount: number;
  PerUserLimit: number;
  ApplyScope: ApplyScope;
  StartDate: string;
  EndDate: string;
  Status: PromotionStatus;
  CreatedBy?: number | null;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface UserPromotion {
  UserPromotionID: number;
  PromotionID: number;
  UserID: number;
  Status: UserPromotionStatus;
  AssignedAt: string;
  UsedAt?: string | null;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface PromotionUsage {
  PromotionUsageID: number;
  PromotionID: number;
  UserID: number;
  BookingID: number;
  DiscountAmount: number;
  OriginalAmount: number;
  FinalAmount: number;
  Status: PromotionUsageStatus;
  ReservedAt: string;
  UsedAt?: string | null;
  ReleasedAt?: string | null;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

// ── Input Types ──────────────────────────────────────────────────────────────

export interface CreatePromotionInput {
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

export interface UpdatePromotionInput {
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

export interface ValidatePromotionInput {
  promotionCode: string;
  bookingId: number;
}

export interface ApplyPromotionInput {
  bookingId: number;
  promotionCode: string;
}

// ── Output Types ─────────────────────────────────────────────────────────────

export interface ValidatePromotionResult {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  discountType: DiscountType;
  discountValue: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface ApplyPromotionResult {
  bookingId: number;
  promotionId: number;
  promotionCode: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}