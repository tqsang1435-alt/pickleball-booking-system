import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentFailedPage from "@/modules/payments/PaymentFailedPage";

export const metadata: Metadata = {
  title: "Thanh toán thất bại | PickleClub",
  description: "Giao dịch không thành công. Bạn có thể thanh toán lại.",
};

/**
 * /payment/failed
 * Redirect về đây sau khi thanh toán thất bại hoặc bị hủy từ VNPay/MoMo.
 * Query: ?bookingId=...&code=...&error=...
 */
export default function PaymentFailedRoute() {
  return (
    <Suspense fallback={null}>
      <PaymentFailedPage />
    </Suspense>
  );
}
