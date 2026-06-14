import { NextRequest } from "next/server";
import { getPaymentStatusController } from "@/modules/payments/payments.controller";

/**
 * GET /api/payments/status?bookingId=...
 * UC-16: Xem trạng thái payment của booking.
 *
 * Query: bookingId=<number>
 * Auth: Bearer token required (chỉ user sở hữu booking)
 */
export async function GET(req: NextRequest) {
  return getPaymentStatusController(req);
}
