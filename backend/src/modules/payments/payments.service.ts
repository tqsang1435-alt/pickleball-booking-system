// ==========================================
// payments.service.ts
// Business logic for Payment module (UC-16)
// ==========================================

import { paymentConfig } from "@/config/payment";
import { getPool, sql } from "@/database/connection";
import { createNotification } from "@/modules/notifications/notifications.service";
import {
  findBookingForPayment,
  hasPaidPayment,
  expireOldPendingPayments,
  createPendingPayment,
  updatePaymentGatewayInfo,
  getPaymentByCode,
  getPaymentByGatewayOrderId,
  getPaymentStatus,
  markPaymentPaid,
  markPaymentFailed,
  getCoachOrComboPaymentSuccessEmailData,
} from "./payments.repository";

import {
  createPayosPaymentLink,
  verifyPayosWebhook,
  isPayosWebhookSuccess,
  cancelPayosPaymentLink,
} from "./gateways/payos.gateway";
import {
  createMomoPaymentLink,
  verifyMomoIpn,
  isMomoWebhookSuccess,
} from "./gateways/momo.gateway";
import type {
  CreatePaymentInput,
  CreatePaymentResponse,
  PayosWebhookBody,
  MomoWebhookBody,
  PaymentStatusResponse,
} from "./payments.type";

// ── Helpers ───────────────────────────────────────────

/**
 * Tạo PaymentCode theo format: PAY-{BookingID}-{yyyyMMddHHmmss}-{random6}.
 */
function generatePaymentCode(bookingId: number): string {
  const now = new Date();
  // UTC+7
  const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts =
    `${vn.getUTCFullYear()}` +
    `${pad(vn.getUTCMonth() + 1)}` +
    `${pad(vn.getUTCDate())}` +
    `${pad(vn.getUTCHours())}` +
    `${pad(vn.getUTCMinutes())}` +
    `${pad(vn.getUTCSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAY-${bookingId}-${ts}-${rand}`;
}



// ── API 1: Create Payment ─────────────────────────────

/**
 * UC-16: Tạo payment và trả về payment URL.
 * BR-66: Không tạo nếu đã có payment Paid.
 * BR-67: ExpiredAt = +10 phút.
 * BR-69: Amount lấy từ Bookings.TotalAmount.
 */
export async function createPayment(
  input: CreatePaymentInput,
  req: { headers: { get: (k: string) => string | null } }
): Promise<CreatePaymentResponse> {
  // 1. Tìm booking theo bookingId VÀ userId (ownership check)
  const booking = await findBookingForPayment(input.bookingId, input.userId);

  if (!booking) {
    // Nếu booking tồn tại nhưng không thuộc user → 403 logic ở service
    // Ở đây trả 404 vì không phân biệt được (bảo mật: không tiết lộ booking tồn tại hay không)
    throw Object.assign(
      new Error("Booking không tồn tại hoặc bạn không có quyền thanh toán booking này"),
      { statusCode: 404 }
    );
  }

  // 2. Kiểm tra booking đang PendingPayment
  if (booking.Status !== "PendingPayment") {
    throw Object.assign(
      new Error(
        `Không thể thanh toán booking ở trạng thái ${booking.Status}. Chỉ thanh toán được khi booking đang PendingPayment.`
      ),
      { statusCode: 409 }
    );
  }

  // 3. BR-66: Kiểm tra chưa có payment Paid
  const alreadyPaid = await hasPaidPayment(input.bookingId);
  if (alreadyPaid) {
    throw Object.assign(
      new Error("Booking này đã được thanh toán thành công (BR-66)"),
      { statusCode: 409 }
    );
  }

  // 4. BR-10: Expire các payment Pending cũ đã hết hạn
  await expireOldPendingPayments(input.bookingId);

  // 5. BR-69: Amount từ Bookings.TotalAmount (không từ frontend)
  const amount = Number(booking.TotalAmount);
  if (amount <= 0) {
    throw Object.assign(
      new Error("Số tiền thanh toán không hợp lệ"),
      { statusCode: 400 }
    );
  }

  // 6. Tạo PaymentCode
  const paymentCode = generatePaymentCode(input.bookingId);

  // 7. Insert Payments với Status = 'Pending'
  const { paymentId, expiredAt } = await createPendingPayment({
    bookingId: input.bookingId,
    paymentMethod: input.paymentMethod,
    amount,
    paymentCode,
  });

  // 8. Gọi Gateway SDK để tạo payment link
  let paymentUrl = "";
  let gatewayOrderId = "";

  if (input.paymentMethod === "PayOS") {
    // orderCode = paymentId (integer, unique trong DB)
    const payosResult = await createPayosPaymentLink({
      paymentId,
      amount,
      paymentCode,
      bookingId: input.bookingId,
    });

    // Lưu gateway info (kể cả khi thất bại để debug)
    await updatePaymentGatewayInfo(paymentId, {
      gatewayOrderId: String(payosResult.orderCode),
      gatewayResponse: payosResult.rawResponse,
    });

    if (!payosResult.success || !payosResult.checkoutUrl) {
      throw Object.assign(
        new Error(
          `Không thể tạo payment PayOS: ${payosResult.errorMessage ?? "Unknown error"}`
        ),
        { statusCode: 502 }
      );
    }

    paymentUrl = payosResult.checkoutUrl;
    gatewayOrderId = String(paymentId);
  } else if (input.paymentMethod === "Momo") {
    const momoResult = await createMomoPaymentLink({
      paymentId,
      amount,
      paymentCode,
      bookingId: input.bookingId,
    });

    await updatePaymentGatewayInfo(paymentId, {
      gatewayOrderId: paymentCode,
      gatewayResponse: momoResult.rawResponse,
    });

    if (!momoResult.success || !momoResult.checkoutUrl) {
      throw Object.assign(
        new Error(
          `Không thể tạo payment MoMo: ${momoResult.errorMessage ?? "Unknown error"}`
        ),
        { statusCode: 502 }
      );
    }

    paymentUrl = momoResult.checkoutUrl;
    gatewayOrderId = paymentCode;
  }

  return {
    paymentId,
    bookingId: input.bookingId,
    paymentCode,
    paymentMethod: input.paymentMethod,
    amount,
    status: "Pending",
    expiredAt,
    paymentUrl,
    gatewayOrderId,
  };
}

// ── API 2: Get Payment Status ─────────────────────────

/**
 * Chỉ user sở hữu booking mới xem được.
 * Lấy booking status + payment status mới nhất.
 */
export async function getPaymentStatusService(
  bookingId: number,
  userId: number
): Promise<PaymentStatusResponse> {
  const status = await getPaymentStatus(bookingId, userId);

  if (!status) {
    throw Object.assign(
      new Error("Booking không tồn tại hoặc bạn không có quyền xem"),
      { statusCode: 404 }
    );
  }

  // Tự động đồng bộ trạng thái thực tế từ PayOS nếu đang là Pending ở môi trường local
  if (status.paymentStatus === "Pending" && status.paymentMethod === "PayOS" && status.gatewayOrderId) {
    try {
      const { getPayosPaymentInfo } = await import("./gateways/payos.gateway");
      const payosInfo = await getPayosPaymentInfo(Number(status.gatewayOrderId)) as any;
      if (payosInfo && payosInfo.status === "PAID") {
        console.info(`[Auto Sync Booking] Payment ${status.paymentId} was PAID on PayOS! Updating db...`);
        const txCode = payosInfo.transactions?.[0]?.reference || String(status.gatewayOrderId);
        await markPaymentPaidFromBookingDetails(status.paymentId!, bookingId, {
          transactionCode: txCode,
          gatewayResponse: JSON.stringify(payosInfo),
        });
        await sendPaymentNotification(
          bookingId,
          "PayOS",
          true,
          status.paymentCode ?? undefined,
          txCode
        );
        // Lấy lại thông tin trạng thái mới nhất đã cập nhật từ DB
        return getPaymentStatusService(bookingId, userId);
      }
    } catch (err: any) {
      console.warn(`[Auto Sync Booking] Failed to sync status for payment ${status.paymentId}:`, err.message);
    }
  }

  return status;
}



// ── Internal Helpers ──────────────────────────────────

/**
 * Lấy SlotID và CoachScheduleID từ BookingDetails trước khi gọi markPaymentPaid.
 * Dùng trong IPN/return handlers để không hardcode null cho slot/coach.
 */
async function markPaymentPaidFromBookingDetails(
  paymentId: number,
  bookingId: number,
  data: { transactionCode: string; gatewayResponse: string }
): Promise<void> {
  // Lấy SlotID và CoachScheduleID từ BookingDetails
  const { getPool, sql } = await import("@/database/connection");
  const pool = await getPool();

  const bdResult = await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      SELECT SlotID, CoachScheduleID
      FROM BookingDetails
      WHERE BookingID = @BookingID
    `);

  const bd = bdResult.recordset[0];

  await markPaymentPaid({
    paymentId,
    bookingId,
    transactionCode: data.transactionCode,
    gatewayResponse: data.gatewayResponse,
    slotId: bd?.SlotID ?? null,
    coachScheduleId: bd?.CoachScheduleID ?? null,
  });
}

/**
 * Gửi notification + email sau khi payment thành công/thất bại.
 * Phải được gọi bằng await để lỗi email được log ra terminal.
 * Không throw – catch nội bộ để không block webhook response.
 */
async function sendPaymentNotification(
  bookingId: number,
  method: string,
  success: boolean,
  paymentCode?: string,
  transactionCode?: string
): Promise<void> {
  try {
    console.log(`[PaymentNotif] START bookingId=${bookingId} method=${method} success=${success}`);
    const { getPool, sql } = await import("@/database/connection");
    const pool = await getPool();

    // Lấy đầy đủ thông tin booking, user, court, coach
    // NOTE: StartTime, EndTime, CourtID, CoachID nằm trong BookingDetails, không phải Bookings
    const bkResult = await pool
      .request()
      .input("BookingID", sql.Int, bookingId)
      .query(`
        SELECT
          b.BookingCode, b.BookingType,
          b.TotalAmount, b.DiscountAmount,
          CONVERT(VARCHAR(10), bd.BookingDate, 103) AS BookingDate,
          CONVERT(VARCHAR(5),  bd.StartTime,   108) AS StartTime,
          CONVERT(VARCHAR(5),  bd.EndTime,     108) AS EndTime,
          u.UserID, u.Email, u.FullName,
          c.CourtName,
          co.CoachID, co.UserID AS CoachUserID
        FROM Bookings b
        JOIN Users u ON b.UserID = u.UserID
        LEFT JOIN BookingDetails bd ON bd.BookingID = b.BookingID
        LEFT JOIN Courts   c  ON bd.CourtID  = c.CourtID
        LEFT JOIN Coaches  co ON bd.CoachID  = co.CoachID
        WHERE b.BookingID = @BookingID
      `);

    const bk = bkResult.recordset[0];
    if (!bk) {
      console.warn(`[PaymentNotif] BookingID ${bookingId} not found`);
      return;
    }

    if (success) {
      // 1. Tạo web notification
      await createNotification({
        userId: bk.UserID,
        title: "Thanh toán thành công",
        message: `Booking #${bk.BookingCode} tại ${bk.CourtName ?? "sân"} đã được thanh toán qua ${method}. Chúc bạn chơi vui vẻ!`,
        notificationType: "Payment",
      });

      // 2. Lấy tên HLV nếu có
      let coachName: string | undefined;
      if (bk.CoachUserID) {
        const coachRes = await pool
          .request()
          .input("UID", sql.Int, bk.CoachUserID)
          .query("SELECT FullName FROM Users WHERE UserID = @UID");
        coachName = coachRes.recordset[0]?.FullName ?? undefined;
      }

      // 3. Loại booking
      let bookingTypeStr = "Sân (Court)";
      if (bk.BookingType === "Coach") bookingTypeStr = "HLV (Coach)";
      if (bk.BookingType === "Combo") bookingTypeStr = "Combo (Sân + HLV)";

      const { sendPaymentSuccessEmail, sendCoachNewTeachingScheduleEmail } = await import("@/utils/mail");

      if (bk.BookingType === "Coach" || bk.BookingType === "Combo") {
        console.log(`[CoachComboEmail] START sending email for bookingId=${bookingId}, type=${bk.BookingType}`);
        const detailedData = await getCoachOrComboPaymentSuccessEmailData(bookingId);
        
        if (detailedData) {
          // Gửi cho Player
          if (detailedData.playerEmail) {
            console.log(`[CoachComboEmail] sending player confirmation email to ${detailedData.playerEmail}`);
            await sendPaymentSuccessEmail(detailedData.playerEmail, {
              playerName:     detailedData.playerName,
              bookingCode:    detailedData.bookingCode,
              bookingType:    bookingTypeStr,
              bookingDate:    detailedData.bookingDate,
              startTime:      detailedData.startTime,
              endTime:        detailedData.endTime,
              courtName:      detailedData.courtName ?? undefined,
              coachName:      detailedData.coachName ?? undefined,
              courtFee:       Number(detailedData.courtFee),
              coachFee:       Number(detailedData.coachFee),
              originalAmount: Number(detailedData.originalAmount),
              amount:         Number(detailedData.paidAmount),
              discountAmount: detailedData.discountAmount ? Number(detailedData.discountAmount) : undefined,
              paymentMethod:  method,
              paymentCode:    paymentCode,
              transactionCode: transactionCode,
            });
            console.log(`[CoachComboEmail] player email sent`);
          } else {
            console.warn(`[CoachComboEmail] Player ${detailedData.playerUserId} không có email`);
          }

          // Gửi cho Coach
          if (detailedData.coachUserId && detailedData.coachEmail) {
            console.log(`[CoachComboEmail] sending coach schedule email to ${detailedData.coachEmail}`);
            await sendCoachNewTeachingScheduleEmail(detailedData.coachEmail, {
              coachName: detailedData.coachName,
              playerName: detailedData.playerName,
              playerEmail: detailedData.playerEmail ?? undefined,
              playerPhone: detailedData.playerPhone ?? undefined,
              bookingId: detailedData.bookingId,
              bookingCode: detailedData.bookingCode,
              bookingType: bookingTypeStr,
              courtName: detailedData.courtName ?? undefined,
              courtCode: detailedData.courtCode ?? undefined,
              courtLocation: detailedData.courtLocation ?? undefined,
              bookingDate: detailedData.bookingDate,
              startTime: detailedData.startTime,
              endTime: detailedData.endTime,
              coachFee: Number(detailedData.coachFee)
            });
            console.log(`[CoachComboEmail] coach email sent`);

            // Tạo notification cho Coach
            await createNotification({
              userId: detailedData.coachUserId,
              title: "Bạn có lịch dạy mới",
              message: bk.BookingType === "Combo" 
                ? `Booking ${detailedData.bookingCode} với học viên ${detailedData.playerName} tại sân ${detailedData.courtName} vào ${detailedData.bookingDate} ${detailedData.startTime}-${detailedData.endTime} đã được xác nhận.`
                : `Booking ${detailedData.bookingCode} với học viên ${detailedData.playerName} vào ${detailedData.bookingDate} ${detailedData.startTime}-${detailedData.endTime} đã được xác nhận.`,
              notificationType: "Payment" // using Payment or Booking type
            });
          } else {
             console.warn(`[CoachComboEmail] Coach email missing or no coach for bookingId=${bookingId}`);
          }
        }
      } else {
        // Gửi email – PHẢI dùng await, không dùng void
        if (!bk.Email) {
          console.warn(`[PaymentNotif] User ${bk.UserID} không có email, bỏ qua gửi mail`);
        } else {
          await sendPaymentSuccessEmail(bk.Email, {
            playerName:     bk.FullName,
            bookingCode:    bk.BookingCode,
            bookingType:    bookingTypeStr,
            bookingDate:    bk.BookingDate,
            startTime:      bk.StartTime,
            endTime:        bk.EndTime,
            courtName:      bk.CourtName ?? undefined,
            coachName:      bk.BookingType !== "Court" ? coachName : undefined,
            amount:         Number(bk.TotalAmount),
            discountAmount: bk.DiscountAmount ? Number(bk.DiscountAmount) : undefined,
            paymentMethod:  method,
            paymentCode:    paymentCode,
            transactionCode: transactionCode,
          });
        }
      }
    } else {
      // Payment thất bại – chỉ tạo notification, không gửi email
      await createNotification({
        userId: bk.UserID,
        title: "Thanh toán thất bại",
        message: `Thanh toán booking #${bk.BookingCode} qua ${method} không thành công. Bạn có thể thử lại.`,
        notificationType: "Payment",
      });
    }
  } catch (err) {
    console.error("[PaymentNotif] sendPaymentNotification failed:", err);
  }
}


// ── API 7: PayOS Webhook (server-to-server) ───────────

export type PayosWebhookResponse = {
  success: boolean;
};

/**
 * Xử lý PayOS Webhook – server-to-server callback chính thức.
 * BR-68: Chỉ update Paid sau khi verify signature hợp lệ.
 * Idempotent: nếu đã Paid thì không update lại.
 *
 * payOS gửi POST với body JSON chứa data + signature.
 */
export async function handlePayosWebhook(
  body: PayosWebhookBody
): Promise<PayosWebhookResponse> {
  // 1. Verify webhook signature bằng SDK chính thức
  const verified = await verifyPayosWebhook(body);

  if (!verified.isValid || !verified.data) {
    console.warn("[PayOS Webhook] Invalid signature – rejected");
    return { success: false };
  }

  const webhookData = verified.data;
  const orderCode = webhookData.orderCode;
  const webhookAmount = webhookData.amount;
  const reference = webhookData.reference;
  const description = webhookData.description || "";

  // Intercept tournament payment
  if (description.startsWith("GL")) {
    console.info(`[PayOS Webhook] Detected tournament payment for orderCode=${orderCode}, description=${description}`);
    try {
      const { handleTournamentPaymentWebhook } = await import("../tournaments/tournaments.service");
      await handleTournamentPaymentWebhook({
        paymentId: orderCode,
        transactionCode: reference || String(orderCode),
        gatewayResponse: JSON.stringify(body),
        success: isPayosWebhookSuccess(webhookData.code),
      });
      return { success: true };
    } catch (err: any) {
      console.error("[PayOS Webhook] Failed to handle tournament payment:", err.message);
      return { success: false };
    }
  }

  // 2. Tìm payment theo GatewayOrderId = orderCode (string)
  const payment = await getPaymentByGatewayOrderId(String(orderCode));

  if (!payment) {
    console.warn(`[PayOS Webhook] Payment not found for orderCode=${orderCode}`);
    // Trả success để payOS không retry (order không tồn tại trong hệ thống)
    return { success: true };
  }

  // 3. Idempotent: đã Paid thì không update lại
  if (payment.Status === "Paid") {
    console.info(`[PayOS Webhook] Payment ${payment.PaymentID} already Paid – skip`);
    return { success: true };
  }

  // 4. So khớp amount (bảo mật: không tin amount từ webhook nếu chênh lệch)
  const dbAmount = Number(payment.Amount);
  if (Math.abs(dbAmount - webhookAmount) > 1) {
    console.error(
      `[PayOS Webhook] Amount mismatch: db=${dbAmount}, webhook=${webhookAmount}`
    );
    return { success: false };
  }

  const rawResponse = JSON.stringify(body);
  const isSuccess = isPayosWebhookSuccess(webhookData.code);

  if (isSuccess) {
    // 5. markPaymentPaid trong transaction (idempotent)
    const txCode = reference || String(orderCode);
    await markPaymentPaidFromBookingDetails(payment.PaymentID, payment.BookingID, {
      transactionCode: txCode,
      gatewayResponse: rawResponse,
    });

    // Gửi notification + email (await để lỗi được log)
    console.log(`[PayOS Webhook] ✅ markPaymentPaid done. Sending notification for bookingId=${payment.BookingID}`);
    await sendPaymentNotification(
      payment.BookingID,
      "PayOS",
      true,
      payment.PaymentCode ?? undefined,
      txCode
    );
    console.log(`[PayOS Webhook] ✅ sendPaymentNotification done for bookingId=${payment.BookingID}`);

    console.info(`[PayOS Webhook] Payment ${payment.PaymentID} marked Paid ✓`);
  } else {
    // 6. markPaymentFailed
    if (payment.Status === "Pending") {
      await markPaymentFailed({
        paymentId: payment.PaymentID,
        gatewayResponse: rawResponse,
      });
    }

    void sendPaymentNotification(payment.BookingID, "PayOS", false);

    console.info(`[PayOS Webhook] Payment ${payment.PaymentID} marked Failed`);
  }

  return { success: true };
}

// ── API 8: PayOS Return (browser redirect) ────────────

export type PayosReturnResult = {
  redirectUrl: string;
};

/**
 * PayOS return URL – user quay lại sau khi thanh toán hoặc scan QR.
 * KHÔNG update trạng thái Paid ở đây.
 * Chỉ redirect về frontend để hiển thị UI.
 * Trạng thái thật phải lấy từ /api/payments/status (đã được webhook update).
 */
export async function handlePayosReturn(
  query: Record<string, string>
): Promise<PayosReturnResult> {
  const cfg = paymentConfig.app;
  const orderCode = query["orderCode"] ?? "";
  const status = query["status"] ?? "";
  const code = query["code"] ?? "";
  const isTournament = query["type"] === "tournament";

  if (isTournament) {
    const { findPaymentById, findRegistrationForPayment } = await import("../tournaments/tournaments.repository");
    const tournamentPayment = await findPaymentById(Number(orderCode));
    let tournamentId = "";
    if (tournamentPayment) {
      const records = await findRegistrationForPayment(tournamentPayment.RegistrationID);
      if (records.length > 0) {
        tournamentId = records[0].TournamentID;
      }
    }
    const tournamentQuery = `type=tournament&registrationId=${tournamentPayment?.RegistrationID ?? ""}&tournamentId=${tournamentId}&`;
    if (code === "00" || status === "PAID") {
      return {
        redirectUrl: `${cfg.frontendSuccessUrl}?${tournamentQuery}orderCode=${orderCode}&method=PayOS`,
      };
    }
    return {
      redirectUrl: `${cfg.frontendStatusUrl}?${tournamentQuery}orderCode=${orderCode}&method=PayOS`,
    };
  }

  // Cần lấy bookingId để frontend có thể load status
  const payment = await getPaymentByGatewayOrderId(orderCode);
  const bookingIdQuery = payment ? `bookingId=${payment.BookingID}&` : "";

  // Nếu payOS báo success (code=00) → redirect về success page
  // Dù vậy, status THẬT vẫn phải chờ webhook. Frontend sẽ poll /api/payments/status.
  if (code === "00" || status === "PAID") {
    return {
      redirectUrl: `${cfg.frontendSuccessUrl}?${bookingIdQuery}orderCode=${orderCode}&method=PayOS`,
    };
  }

  // Nếu user tự quay lại mà chưa thanh toán
  return {
    redirectUrl: `${cfg.frontendStatusUrl}?${bookingIdQuery}orderCode=${orderCode}&method=PayOS`,
  };
}

// ── API 9: PayOS Cancel (browser redirect) ────────────

export type PayosCancelResult = {
  redirectUrl: string;
};

/**
 * User bấm "Hủy" trên trang PayOS.
 * - Tìm payment theo orderCode = GatewayOrderId.
 * - Nếu Pending → markPaymentFailed (user đã chủ động hủy rõ ràng).
 * - Booking giữ nguyên PendingPayment (user có thể tạo payment mới/retry).
 * - Redirect về failed page.
 * - Gọi cancelPayosPaymentLink để dọn dẹp phía payOS (best-effort).
 */
export async function handlePayosCancel(
  query: Record<string, string>
): Promise<PayosCancelResult> {
  const cfg = paymentConfig.app;
  const orderCode = query["orderCode"] ?? "";
  const isTournament = query["type"] === "tournament";

  if (!orderCode) {
    return {
      redirectUrl: `${cfg.frontendFailedUrl}?error=missing_order_code`,
    };
  }

  if (isTournament) {
    const { findPaymentById, findRegistrationForPayment } = await import("../tournaments/tournaments.repository");
    const tournamentPayment = await findPaymentById(Number(orderCode));
    if (!tournamentPayment) {
      return {
        redirectUrl: `${cfg.frontendFailedUrl}?type=tournament&error=payment_not_found`,
      };
    }

    if (tournamentPayment.PaymentStatus === "Pending") {
      const pool = await getPool();
      await pool.request()
        .input("PaymentID", sql.Int, tournamentPayment.TournamentPaymentID)
        .query("UPDATE TournamentPayments SET PaymentStatus = 'Failed' WHERE TournamentPaymentID = @PaymentID");
      
      void cancelPayosPaymentLink(Number(orderCode), "User cancelled");
    }

    const records = await findRegistrationForPayment(tournamentPayment.RegistrationID);
    const tournamentId = records.length > 0 ? records[0].TournamentID : "";

    return {
      redirectUrl: `${cfg.frontendFailedUrl}?type=tournament&registrationId=${tournamentPayment.RegistrationID}&tournamentId=${tournamentId}&orderCode=${orderCode}&reason=cancelled`,
    };
  }

  const payment = await getPaymentByGatewayOrderId(orderCode);

  if (!payment) {
    return {
      redirectUrl: `${cfg.frontendFailedUrl}?error=payment_not_found`,
    };
  }

  // Chỉ update nếu còn Pending (không ghi đè Paid/Failed đã có)
  if (payment.Status === "Pending") {
    await markPaymentFailed({
      paymentId: payment.PaymentID,
      gatewayResponse: JSON.stringify({ reason: "User cancelled on PayOS page", orderCode }),
    });

    // Huỷ link trên PayOS phía server (best-effort, không throw nếu lỗi)
    void cancelPayosPaymentLink(Number(orderCode), "User cancelled");

    void sendPaymentNotification(payment.BookingID, "PayOS", false);
  }

  return {
    redirectUrl: `${cfg.frontendFailedUrl}?bookingId=${payment.BookingID}&orderCode=${orderCode}&reason=cancelled`,
  };
}

// ── API 10: MoMo IPN (server-to-server) ────────────────

export type MomoIpnResponse = {
  success: boolean;
};

/**
 * Handle MoMo IPN
 */
export async function handleMomoIpn(
  body: MomoWebhookBody
): Promise<MomoIpnResponse> {
  const verified = await verifyMomoIpn(body);

  if (!verified.isValid || !verified.data) {
    console.warn("[MoMo IPN] Invalid signature – rejected");
    return { success: false };
  }

  const webhookData = verified.data;
  const orderId = webhookData.orderId;
  const webhookAmount = Number(webhookData.amount);

  // Tìm payment theo orderId
  const payment = await getPaymentByGatewayOrderId(orderId);

  if (!payment) {
    console.warn(`[MoMo IPN] Payment not found for orderId=${orderId}`);
    return { success: true };
  }

  // Idempotent: đã Paid thì bỏ qua
  if (payment.Status === "Paid") {
    console.info(`[MoMo IPN] Payment ${payment.PaymentID} already Paid – skip`);
    return { success: true };
  }

  // So khớp amount
  const dbAmount = Number(payment.Amount);
  if (Math.abs(dbAmount - webhookAmount) > 1) {
    console.error(
      `[MoMo IPN] Amount mismatch: db=${dbAmount}, webhook=${webhookAmount}`
    );
    return { success: false }; // Lỗi amount, không verify được
  }

  const rawResponse = JSON.stringify(body);
  const isSuccess = isMomoWebhookSuccess(webhookData.resultCode);

  if (isSuccess) {
    const momoTxCode = String(webhookData.transId);
    await markPaymentPaidFromBookingDetails(payment.PaymentID, payment.BookingID, {
      transactionCode: momoTxCode,
      gatewayResponse: rawResponse,
    });
    // Gửi notification + email (await để lỗi được log)
    await sendPaymentNotification(
      payment.BookingID,
      "MoMo",
      true,
      payment.PaymentCode ?? undefined,
      momoTxCode
    );
    console.info(`[MoMo IPN] Payment ${payment.PaymentID} marked Paid ✓`);
  } else {
    if (payment.Status === "Pending") {
      await markPaymentFailed({
        paymentId: payment.PaymentID,
        gatewayResponse: rawResponse,
      });
    }
    void sendPaymentNotification(payment.BookingID, "Momo", false);
    console.info(`[MoMo IPN] Payment ${payment.PaymentID} marked Failed`);
  }

  return { success: true };
}

// ── API 11: MoMo Return (browser redirect) ─────────────

export type MomoReturnResult = {
  redirectUrl: string;
};

export async function handleMomoReturn(
  query: Record<string, string>
): Promise<MomoReturnResult> {
  const cfg = paymentConfig.app;
  const orderId = query["orderId"] ?? "";
  const resultCode = query["resultCode"] ?? "";

  const payment = await getPaymentByGatewayOrderId(orderId);
  const bookingIdQuery = payment ? `bookingId=${payment.BookingID}&` : "";

  // resultCode = 0 is success in MoMo
  if (resultCode === "0") {
    return {
      redirectUrl: `${cfg.frontendSuccessUrl}?${bookingIdQuery}orderCode=${orderId}&method=Momo`,
    };
  }

  // Khác 0 là failed/cancelled
  return {
    redirectUrl: `${cfg.frontendFailedUrl}?${bookingIdQuery}orderCode=${orderId}&method=Momo&reason=failed`,
  };
}
