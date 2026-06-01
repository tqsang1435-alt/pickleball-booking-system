import * as refundRepo from "./refunds.repository";
import type { RefundResult } from "./refunds.type";

/**
 * Tao yeu cau hoan tien.
 * Tao record trong bang Refunds voi status 'Requested'.
 * Actual gateway call (VNPay/Momo) se duoc implement sau.
 *
 * @param bookingId - ID booking can hoan tien
 * @param refundAmount - So tien hoan lai
 * @param reason - Ly do hoan tien
 * @returns RefundResult
 */
export async function requestRefund(
  bookingId: number,
  refundAmount: number,
  reason: string
): Promise<RefundResult | null> {
  // Neu refundAmount = 0 thi khong can tao refund record (BR-35)
  if (refundAmount <= 0) {
    return null;
  }

  const payment = await refundRepo.findPaymentByBookingId(bookingId);

  if (!payment) {
    // Chua co payment (booking van dang PendingPayment) → khong can refund
    return null;
  }

  const refundId = await refundRepo.createRefundRecord({
    bookingId,
    paymentId: payment.PaymentID,
    refundAmount,
    reason,
  });

  return {
    refundId,
    bookingId,
    paymentId: payment.PaymentID,
    refundAmount,
    status: "Requested",
    message: `Refund ${refundAmount.toLocaleString("vi-VN")} VND da duoc khoi tao. Se xu ly trong 7 ngay lam viec (BR-37).`,
  };
}
