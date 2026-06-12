import { NextRequest } from "next/server";
import { payosWebhookController } from "@/modules/payments/payments.controller";

/**
 * POST /api/payments/payos-webhook
 * PayOS server-to-server callback sau khi thanh toán hoàn tất.
 * Đây là nguồn xác nhận chính thức – phải verify signature trước khi update Paid.
 * Không yêu cầu Auth (PayOS gọi ngầm từ server của họ).
 */
export async function POST(req: NextRequest) {
  return payosWebhookController(req);
}
