import { NextRequest } from "next/server";
import { payosWebhookController } from "@/modules/payments/payments.controller";

// Thêm hàm GET này để kiểm tra xem link ngrok đã thông chưa
export async function GET() {
  return Response.json({
    message: "PayOS webhook endpoint is active",
  });
}

export async function POST(req: NextRequest) {
  return payosWebhookController(req);
}

