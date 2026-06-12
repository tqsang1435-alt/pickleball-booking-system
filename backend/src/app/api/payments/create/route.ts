import { NextRequest } from "next/server";
import { createPaymentController } from "@/modules/payments/payments.controller";

/**
 * POST /api/payments/create
 * UC-16: Tạo payment và lấy payment URL (VNPay hoặc MoMo).
 *
 * Body: { bookingId: number, paymentMethod: "VNPay" | "Momo" }
 * Auth: Bearer token required
 */
export async function POST(req: NextRequest) {
  return createPaymentController(req);
}
