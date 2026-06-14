import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentSuccessPage from "@/modules/payments/PaymentSuccessPage";

export const metadata: Metadata = {
  title: "Thanh toán thành công | PickleClub",
  description: "Xác nhận thanh toán booking pickleball của bạn.",
};

/**
 * /payment/success
 * Redirect về đây sau khi thanh toán thành công từ VNPay/MoMo.
 * Query: ?bookingId=...&paymentCode=...
 */
export default function PaymentSuccessRoute() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessPage />
    </Suspense>
  );
}
