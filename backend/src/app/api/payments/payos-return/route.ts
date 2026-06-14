import { NextRequest } from "next/server";
import { payosReturnController } from "@/modules/payments/payments.controller";

/**
 * GET /api/payments/payos-return
 * PayOS redirect user về đây sau khi scan QR và thanh toán thành công.
 * KHÔNG update Paid ở đây – chỉ redirect về frontend.
 * Trạng thái thật đến qua webhook (/api/payments/payos-webhook).
 * Không yêu cầu Auth (browser redirect từ PayOS).
 */
export async function GET(req: NextRequest) {
  return payosReturnController(req);
}
