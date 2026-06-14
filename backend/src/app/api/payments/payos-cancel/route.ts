import { NextRequest } from "next/server";
import { payosCancelController } from "@/modules/payments/payments.controller";

/**
 * GET /api/payments/payos-cancel
 * PayOS redirect user về đây khi user bấm "Hủy" trên trang thanh toán PayOS.
 * - Tìm payment theo orderCode.
 * - Nếu Pending → markPaymentFailed.
 * - Booking giữ PendingPayment để user có thể tạo payment mới/retry.
 * - Redirect về frontend failed page.
 * Không yêu cầu Auth (browser redirect từ PayOS).
 */
export async function GET(req: NextRequest) {
  return payosCancelController(req);
}
