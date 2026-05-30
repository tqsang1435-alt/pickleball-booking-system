export interface Promotion {
  PromotionID: number;
  PromotionCode: string;
  PromotionName: string;

  DiscountType: string;
  DiscountValue: number;

  MaxDiscountAmount?: number;
  MinOrderAmount?: number;

  UsageLimit?: number;
  UsedCount?: number;

  StartDate?: string;
  EndDate?: string;

  Status: string;
  CreatedAt?: string;
}