import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentSuccessPage from "@/modules/payments/PaymentSuccessPage";

export const metadata: Metadata = {
  title: "Trạng thái thanh toán | PickleClub",
  description: "Kiểm tra trạng thái giao dịch thanh toán booking pickleball.",
};

/**
 * /payment/status
 * Dùng khi user quay lại sau khi scan QR PayOS nhưng chưa confirm payment.
 * Hoặc khi cần poll trạng thái thanh toán.
 * Dùng lại PaymentSuccessPage – component sẽ tự poll từ /api/payments/status.
 * Query: ?bookingId=...&orderCode=...&method=PayOS
 */
export default function PaymentStatusRoute() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessPage />
    </Suspense>
  );
}
