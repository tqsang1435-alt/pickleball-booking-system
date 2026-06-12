import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentFailedPage from "@/modules/payments/PaymentFailedPage";

export const metadata: Metadata = {
  title: "Đã hủy thanh toán | PickleClub",
  description: "Bạn đã hủy giao dịch. Booking vẫn được giữ và bạn có thể thanh toán lại.",
};

/**
 * /payment/cancel
 * Redirect về đây khi user bấm Hủy trên trang PayOS.
 * Dùng lại PaymentFailedPage – query ?reason=cancelled sẽ hiển thị message phù hợp.
 * Query: ?bookingId=...&orderCode=...&reason=cancelled
 */
export default function PaymentCancelRoute() {
  return (
    <Suspense fallback={null}>
      <PaymentFailedPage />
    </Suspense>
  );
}
