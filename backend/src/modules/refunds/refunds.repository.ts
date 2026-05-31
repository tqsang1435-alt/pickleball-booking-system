import { getPool, sql } from "@/database/connection";
import type { CreateRefundInput } from "./refunds.type";

/**
 * Tim Payment theo BookingID.
 * Dung de lay PaymentID truoc khi tao refund.
 */
export async function findPaymentByBookingId(bookingId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      SELECT TOP 1
        PaymentID,
        BookingID,
        PaymentMethod,
        Amount,
        TransactionCode,
        Status
      FROM Payments
      WHERE BookingID = @BookingID
        AND Status = 'Paid'
      ORDER BY PaidAt DESC
    `);

  return result.recordset[0] ?? null;
}

/**
 * Tao record Refund voi status 'Requested'.
 * Actual gateway refund (VNPay/Momo) se duoc implement boi dev sau.
 */
export async function createRefundRecord(input: CreateRefundInput) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("BookingID", sql.Int, input.bookingId)
    .input("PaymentID", sql.Int, input.paymentId)
    .input("RefundAmount", sql.Decimal(18, 2), input.refundAmount)
    .input("Reason", sql.NVarChar(255), input.reason)
    .query(`
      INSERT INTO Refunds (BookingID, PaymentID, RefundAmount, Reason, Status, RequestedAt)
      OUTPUT INSERTED.RefundID
      VALUES (@BookingID, @PaymentID, @RefundAmount, @Reason, 'Requested', GETDATE())
    `);

  return result.recordset[0].RefundID as number;
}
