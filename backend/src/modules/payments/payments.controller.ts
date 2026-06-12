// ==========================================
// payments.controller.ts
// HTTP handlers for Payment module (UC-16)
// Pattern: giống bookings.controller.ts – requireAuth + handleError
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { createPaymentSchema } from "./payments.validation";
import {
  createPayment,
  getPaymentStatusService,
  handlePayosWebhook,
  handlePayosReturn,
  handlePayosCancel,
  handleMomoIpn,
  handleMomoReturn,
} from "./payments.service";
import type { PayosWebhookBody } from "./payments.type";

// ── API 1: POST /api/payments/create ─────────────────

/**
 * UC-16: Tạo payment và lấy payment URL.
 * - userId lấy từ JWT (không từ body).
 * - paymentMethod: "VNPay" hoặc "Momo".
 * - amount: từ Bookings.TotalAmount (không từ frontend).
 */
export async function createPaymentController(req: NextRequest) {
  try {
    // 1. Auth check
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    // 2. Parse và validate body bằng zod
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createPaymentSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parseResult.error.flatten());
    }

    const body = parseResult.data;

    // 3. Gọi service
    const result = await createPayment(
      {
        bookingId: body.bookingId,
        userId: auth.userId, // Lấy từ JWT, không từ body
        paymentMethod: body.paymentMethod,
      },
      req
    );

    return successResponse(result, "Payment URL created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

// ── API 2: GET /api/payments/status?bookingId=... ────

/**
 * Xem trạng thái payment của booking.
 * Chỉ user sở hữu booking mới xem được.
 */
export async function getPaymentStatusController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(req.url);
    const bookingIdStr = searchParams.get("bookingId");

    if (!bookingIdStr || isNaN(Number(bookingIdStr))) {
      return errorResponse("bookingId là bắt buộc và phải là số", 400);
    }

    const bookingId = Number(bookingIdStr);
    const result = await getPaymentStatusService(bookingId, auth.userId);

    return successResponse(result, "Lấy trạng thái payment thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ── API 7: POST /api/payments/payos-webhook ────────────

/**
 * PayOS Webhook: server-to-server callback chính thức.
 * - Verify signature trước khi update Paid.
 * - Idempotent.
 * - Trả { success: true/false }.
 */
export async function payosWebhookController(req: NextRequest) {
  try {
    const body = (await req.json()) as PayosWebhookBody;
    const result = await handlePayosWebhook(body);

    if (!result.success) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[PayOS Webhook] Error:", error);
    // Trả 200 để payOS không retry vô hạn với lỗi server
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

// ── API 8: GET /api/payments/payos-return ─────────────

/**
 * PayOS return URL: user quay lại sau khi thanh toán / scan QR.
 * Chỉ redirect – không update Paid.
 */
export async function payosReturnController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });

    const result = await handlePayosReturn(query);
    return NextResponse.redirect(result.redirectUrl, 302);
  } catch (error) {
    console.error("[PayOS Return] Error:", error);
    const failedUrl =
      process.env.FRONTEND_PAYMENT_FAILED_URL ||
      "http://localhost:3000/payment/failed";
    return NextResponse.redirect(`${failedUrl}?error=server_error`, 302);
  }
}

// ── API 9: GET /api/payments/payos-cancel ─────────────

/**
 * PayOS cancel URL: user bấm Hủy trên trang payOS.
 * - Tìm payment, nếu Pending → mark Failed.
 * - Booking giữ nguyên PendingPayment (có thể retry).
 * - Redirect về failed page.
 */
export async function payosCancelController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });

    const result = await handlePayosCancel(query);
    return NextResponse.redirect(result.redirectUrl, 302);
  } catch (error) {
    console.error("[PayOS Cancel] Error:", error);
    const failedUrl =
      process.env.FRONTEND_PAYMENT_FAILED_URL ||
      "http://localhost:3000/payment/failed";
    return NextResponse.redirect(`${failedUrl}?error=server_error`, 302);
  }
}

// ── API 10: POST /api/payments/momo-ipn ─────────────────

export async function momoIpnController(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const result = await handleMomoIpn(body);

    // MoMo yêu cầu trả về HTTP 204 No Content cho IPN thành công/thất bại hợp lệ
    // hoặc 200 OK với body nhỏ.
    if (!result.success) {
      return NextResponse.json({ message: "error" }, { status: 400 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[MoMo IPN] Error:", error);
    return NextResponse.json({ message: "error" }, { status: 500 });
  }
}

// ── API 11: GET /api/payments/momo-return ───────────────

export async function momoReturnController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string> = {};
    searchParams.forEach((v, k) => { query[k] = v; });

    const result = await handleMomoReturn(query);
    return NextResponse.redirect(result.redirectUrl, 302);
  } catch (error) {
    console.error("[MoMo Return] Error:", error);
    const failedUrl =
      process.env.FRONTEND_PAYMENT_FAILED_URL ||
      "http://localhost:3000/payment/failed";
    return NextResponse.redirect(`${failedUrl}?error=server_error`, 302);
  }
}
