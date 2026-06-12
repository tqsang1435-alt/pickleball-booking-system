// ==========================================
// payments.validation.ts
// Zod schemas for Payment module (UC-16)
// Zod v4 compatible
// ==========================================

import { z } from "zod";

// ── Schema: POST /api/payments/create ────────────────

/**
 * Validate body của API tạo payment.
 * - paymentMethod: chỉ nhận "PayOS".
 * - bookingId: số nguyên dương.
 * - Không nhận amount từ frontend (BR-69).
 */
export const createPaymentSchema = z.object({
  bookingId: z
    .number()
    .int("bookingId phải là số nguyên")
    .positive("bookingId phải là số dương"),

  // Zod v4: z.enum nhận tuple as const
  paymentMethod: z.enum(["PayOS", "Momo"] as const, {
    error: "paymentMethod chỉ nhận 'PayOS' hoặc 'Momo'",
  }),
});

export type CreatePaymentBody = z.infer<typeof createPaymentSchema>;

// ── Schema: internal paymentCode validation ───────────

export const paymentCodeSchema = z
  .string()
  .min(1, "paymentCode không được rỗng")
  .regex(/^PAY-/, "paymentCode phải bắt đầu bằng PAY-");

