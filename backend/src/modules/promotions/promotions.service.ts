// ==========================================
// promotions.service.ts
// Business logic for Voucher / Promotion module
// ==========================================

import * as repo from "./promotions.repository";
import { getPool, sql } from "@/database/connection";
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
  ValidatePromotionResult,
  ApplyPromotionResult,
} from "./promotions.type";

// ── BR-70: Max discount = 50% booking value ───────────────────────────────
const MAX_DISCOUNT_PERCENT = 50;

// ── Helpers ───────────────────────────────────────────────────────────────

function calcDiscount(
  bookingAmount: number,
  discountType: string,
  discountValue: number,
  maxDiscountAmount?: number | null
): number {
  let discount =
    discountType === "Percent"
      ? Math.floor((bookingAmount * discountValue) / 100)
      : Math.floor(discountValue);

  // Cap by MaxDiscountAmount
  if (maxDiscountAmount != null && discount > maxDiscountAmount) {
    discount = maxDiscountAmount;
  }

  // BR-70: cap at 50% of booking amount
  const cap50 = Math.floor((bookingAmount * MAX_DISCOUNT_PERCENT) / 100);
  if (discount > cap50) discount = cap50;

  // Cannot exceed booking amount
  if (discount > bookingAmount) discount = bookingAmount;

  return discount;
}

async function getBookingForPromotion(bookingId: number) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      SELECT BookingID, UserID, Status, TotalAmount, OriginalAmount,
             DiscountAmount, PromotionID, CourtFee, CoachFee
      FROM Bookings
      WHERE BookingID = @BookingID
    `);
  return result.recordset[0] ?? null;
}

// ── User APIs ─────────────────────────────────────────────────────────────

/**
 * Lấy danh sách voucher user có thể dùng.
 * - Public: active, trong date, còn lượt dùng
 * - Private: được gán, chưa dùng hết
 */
export async function getMyPromotions(userId: number, bookingAmount?: number) {
  const [publicPromos, privatePromos] = await Promise.all([
    repo.findActivePublicPromotions(bookingAmount),
    repo.findUserPrivatePromotions(userId, bookingAmount),
  ]);

  const publicList = publicPromos.map((p) => ({ ...p, source: "Public" }));
  const privateList = privatePromos.map((p) => ({ ...p, source: "Private" }));

  // Deduplicate (nếu voucher public cũng được gán cho user)
  const seen = new Set<number>();
  const all = [...privateList, ...publicList].filter((p) => {
    if (seen.has(p.PromotionID)) return false;
    seen.add(p.PromotionID);
    return true;
  });

  return all.map((p) => ({
    promotionId: p.PromotionID,
    promotionCode: p.PromotionCode,
    promotionName: p.PromotionName,
    description: p.Description,
    discountType: p.DiscountType,
    discountValue: p.DiscountValue,
    maxDiscountAmount: p.MaxDiscountAmount,
    minBookingAmount: p.MinOrderAmount,
    startDate: p.StartDate,
    endDate: p.EndDate,
    applyScope: p.ApplyScope,
    status: p.Status,
    usageLimit: p.UsageLimit,
    usedCount: p.UsedCount,
    perUserLimit: p.PerUserLimit,
  }));
}

/**
 * Validate voucher + tính discount. Không cập nhật booking.
 */
export async function validatePromotion(
  userId: number,
  promotionCode: string,
  bookingId: number
): Promise<ValidatePromotionResult> {
  // 1. Tìm promotion
  const promo = await repo.findPromotionByCode(promotionCode);
  if (!promo) throw Object.assign(new Error("Mã voucher không tồn tại"), { statusCode: 404 });

  // 2. Status Active
  if (promo.Status !== "Active") {
    throw Object.assign(new Error("Voucher không còn hoạt động"), { statusCode: 400 });
  }

  // 3. Kiểm tra ngày
  const today = new Date().toISOString().split("T")[0];
  
  // Format Date object to YYYY-MM-DD string, handling both string and Date types safely
  const formatYYYYMMDD = (d: any) => {
    if (d instanceof Date) return d.toISOString().split("T")[0];
    if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
    return new Date(d).toISOString().split("T")[0];
  };

  const start = formatYYYYMMDD(promo.StartDate);
  const end = formatYYYYMMDD(promo.EndDate);

  if (today < start || today > end) {
    throw Object.assign(new Error("Voucher không trong thời gian hiệu lực"), { statusCode: 400 });
  }

  // 4. Kiểm tra UsageLimit
  if (promo.UsageLimit != null && promo.UsedCount >= promo.UsageLimit) {
    throw Object.assign(new Error("Voucher đã hết lượt sử dụng"), { statusCode: 400 });
  }

  // 5. Private scope: user phải được gán
  if (promo.ApplyScope === "Private") {
    const up = await repo.findUserPromotionRecord(promo.PromotionID, userId);
    if (!up || up.Status !== "Assigned") {
      throw Object.assign(new Error("Bạn không có quyền sử dụng voucher này"), { statusCode: 403 });
    }
  }

  // 6. PerUserLimit
  const usedByUser = await repo.countUserPromotionUsages(promo.PromotionID, userId);
  if (usedByUser >= promo.PerUserLimit) {
    throw Object.assign(new Error(`Bạn đã sử dụng voucher này tối đa ${promo.PerUserLimit} lần`), { statusCode: 400 });
  }

  // 7. Lấy booking
  const booking = await getBookingForPromotion(bookingId);
  if (!booking) throw Object.assign(new Error("Booking không tồn tại"), { statusCode: 404 });
  if (booking.UserID !== userId) throw Object.assign(new Error("Bạn không sở hữu booking này"), { statusCode: 403 });
  if (booking.Status !== "PendingPayment") {
    throw Object.assign(new Error("Chỉ áp dụng voucher khi booking đang PendingPayment"), { statusCode: 400 });
  }

  // 8. Tính original amount (giá gốc trước giảm)
  const originalAmount = Number(booking.OriginalAmount ?? booking.TotalAmount + booking.DiscountAmount);

  // 9. MinBookingAmount
  if (originalAmount < Number(promo.MinOrderAmount)) {
    throw Object.assign(
      new Error(`Đơn hàng tối thiểu ${Number(promo.MinOrderAmount).toLocaleString("vi-VN")}đ để dùng voucher này`),
      { statusCode: 400 }
    );
  }

  // 10. Tính discount
  const discountAmount = calcDiscount(
    originalAmount,
    promo.DiscountType,
    Number(promo.DiscountValue),
    promo.MaxDiscountAmount != null ? Number(promo.MaxDiscountAmount) : null
  );
  const finalAmount = originalAmount - discountAmount;

  return {
    promotionId: promo.PromotionID,
    promotionCode: promo.PromotionCode,
    promotionName: promo.PromotionName,
    discountType: promo.DiscountType,
    discountValue: Number(promo.DiscountValue),
    originalAmount,
    discountAmount,
    finalAmount,
  };
}

/**
 * Áp dụng voucher vào booking.
 */
export async function applyPromotion(
  userId: number,
  bookingId: number,
  promotionCode: string
): Promise<ApplyPromotionResult> {
  // Validate trước
  const validated = await validatePromotion(userId, promotionCode, bookingId);

  const booking = await getBookingForPromotion(bookingId);
  if (!booking) throw Object.assign(new Error("Booking không tồn tại"), { statusCode: 404 });

  // Nếu đã có voucher khác → gỡ usage cũ trước
  if (booking.PromotionID) {
    await repo.repoReleasePromotionUsage(bookingId);
  }

  // Update booking
  await repo.repoApplyPromotionToBooking(
    bookingId,
    validated.promotionId,
    validated.discountAmount,
    validated.originalAmount,
    validated.finalAmount
  );

  // Tạo PromotionUsage Reserved
  await repo.repoCreatePromotionUsage({
    promotionId: validated.promotionId,
    userId,
    bookingId,
    discountAmount: validated.discountAmount,
    originalAmount: validated.originalAmount,
    finalAmount: validated.finalAmount,
  });

  return {
    bookingId,
    promotionId: validated.promotionId,
    promotionCode: validated.promotionCode,
    originalAmount: validated.originalAmount,
    discountAmount: validated.discountAmount,
    finalAmount: validated.finalAmount,
  };
}

/**
 * Gỡ voucher khỏi booking.
 */
export async function removePromotion(userId: number, bookingId: number) {
  const booking = await getBookingForPromotion(bookingId);
  if (!booking) throw Object.assign(new Error("Booking không tồn tại"), { statusCode: 404 });
  if (booking.UserID !== userId) throw Object.assign(new Error("Bạn không sở hữu booking này"), { statusCode: 403 });
  if (booking.Status !== "PendingPayment") {
    throw Object.assign(new Error("Chỉ gỡ voucher khi booking đang PendingPayment"), { statusCode: 400 });
  }
  if (!booking.PromotionID) {
    throw Object.assign(new Error("Booking chưa áp dụng voucher nào"), { statusCode: 400 });
  }

  const originalAmount = Number(booking.OriginalAmount ?? booking.TotalAmount + booking.DiscountAmount);

  // Reset booking
  await repo.repoRemovePromotionFromBooking(bookingId, originalAmount);

  // Release usage
  await repo.repoReleasePromotionUsage(bookingId);

  return {
    bookingId,
    originalAmount,
    discountAmount: 0,
    totalAmount: originalAmount,
    message: "Đã gỡ voucher thành công",
  };
}

/**
 * Hook gọi sau khi payment thành công.
 * Tăng UsedCount, mark PromotionUsage=Used, update UserPromotions nếu private.
 */
export async function onPaymentSuccess(bookingId: number) {
  try {
    const booking = await getBookingForPromotion(bookingId);
    if (!booking || !booking.PromotionID) return;

    const promotionId = booking.PromotionID;
    const userId = booking.UserID;

    // Tăng UsedCount
    await repo.repoIncrementUsedCount(promotionId);

    // Mark PromotionUsage = Used
    await repo.repoMarkPromotionUsageUsed(bookingId);

    // Nếu private và perUserLimit → mark UserPromotions = Used
    const promo = await repo.findPromotionById(promotionId);
    if (promo && promo.ApplyScope === "Private" && promo.PerUserLimit >= 1) {
      // Đếm số lần đã Used
      const usedCount = await repo.countUserPromotionUsages(promotionId, userId);
      if (usedCount >= promo.PerUserLimit) {
        await repo.repoMarkUserPromotionUsed(promotionId, userId);
      }
    }
  } catch (err) {
    console.error("[Promotions] onPaymentSuccess error:", err);
    // Không throw – không block flow payment
  }
}

// ── Admin APIs ────────────────────────────────────────────────────────────

export async function getAllPromotions() {
  return repo.findAllPromotions();
}

export async function adminGetPromotions(filters: {
  status?: string;
  applyScope?: string;
  discountType?: string;
  keyword?: string;
}) {
  return repo.findAdminPromotions(filters);
}

export async function adminGetPromotionDetail(id: number) {
  const promo = await repo.findPromotionById(id);
  if (!promo) throw Object.assign(new Error("Voucher không tồn tại"), { statusCode: 404 });
  return promo;
}

export async function adminCreatePromotion(input: CreatePromotionInput, createdBy: number) {
  // Kiểm tra code trùng
  const existing = await repo.findPromotionByCode(input.promotionCode);
  if (existing) throw Object.assign(new Error("Mã voucher đã tồn tại"), { statusCode: 409 });

  const promotionId = await repo.repoCreatePromotion(input, createdBy);

  // Nếu private → gán users
  if (input.applyScope === "Private" && input.userIds && input.userIds.length > 0) {
    await repo.repoAssignUsersToPromotion(promotionId, input.userIds);
  }

  return { promotionId };
}

export async function adminUpdatePromotion(id: number, input: UpdatePromotionInput) {
  const promo = await repo.findPromotionById(id);
  if (!promo) throw Object.assign(new Error("Voucher không tồn tại"), { statusCode: 404 });
  await repo.repoUpdatePromotion(id, input);
  return repo.findPromotionById(id);
}

export async function adminUpdateStatus(id: number, status: string) {
  const promo = await repo.findPromotionById(id);
  if (!promo) throw Object.assign(new Error("Voucher không tồn tại"), { statusCode: 404 });
  await repo.repoUpdatePromotionStatus(id, status);
  return { promotionId: id, status };
}

export async function adminAssignUsers(promotionId: number, userIds: number[]) {
  const promo = await repo.findPromotionById(promotionId);
  if (!promo) throw Object.assign(new Error("Voucher không tồn tại"), { statusCode: 404 });
  await repo.repoAssignUsersToPromotion(promotionId, userIds);
  return { promotionId, assignedCount: userIds.length };
}

export async function adminRevokeUser(promotionId: number, userId: number) {
  const promo = await repo.findPromotionById(promotionId);
  if (!promo) throw Object.assign(new Error("Voucher không tồn tại"), { statusCode: 404 });

  // Kiểm tra user đã dùng chưa
  const used = await repo.countUserPromotionUsages(promotionId, userId);
  if (used > 0) {
    throw Object.assign(new Error("Không thể thu hồi voucher đã được sử dụng"), { statusCode: 400 });
  }

  await repo.repoRevokeUserPromotion(promotionId, userId);
  return { promotionId, userId, status: "Revoked" };
}

export async function adminGetPromotionUsers(promotionId: number) {
  const promo = await repo.findPromotionById(promotionId);
  if (!promo) throw Object.assign(new Error("Voucher không tồn tại"), { statusCode: 404 });
  return repo.findPromotionUsers(promotionId);
}

export async function adminSearchUsers(keyword: string) {
  if (!keyword || keyword.trim().length < 1) return [];
  return repo.searchUsersForAdmin(keyword.trim());
}