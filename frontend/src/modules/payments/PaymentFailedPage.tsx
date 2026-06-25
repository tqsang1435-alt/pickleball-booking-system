"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPaymentStatus } from "@/services/paymentApi";
import type { PaymentStatusResult } from "@/services/paymentApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./PaymentResultPage.module.css";

function getErrorMessage(code: string | null): string {
  if (!code) return "Giao dịch không thành công. Vui lòng thử lại.";
  return `Mã lỗi: ${code}. Vui lòng thử lại hoặc liên hệ hỗ trợ.`;
}

/**
 * Trang /payment/failed
 *
 * Hỗ trợ gateway: PayOS.
 *
 * Flow:
 * 1. Đọc bookingId + code (error code) từ query string.
 * 2. Gọi GET /api/payments/status để lấy trạng thái THẬT từ backend.
 * 3. Hiển thị thông báo lỗi rõ ràng.
 * 4. Booking vẫn PendingPayment → user có thể thanh toán lại từ /bookings.
 * 5. KHÔNG tự cancel booking ở frontend.
 */
export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const bookingIdStr = searchParams.get("bookingId");
  const errorCode = searchParams.get("code");
  const errorStr = searchParams.get("error");
  const reason = searchParams.get("reason"); // "cancelled" khi user hủy PayOS

  const [status, setStatus] = useState<PaymentStatusResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookingId = Number(bookingIdStr);
    if (!bookingId || isNaN(bookingId)) {
      setLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getPaymentStatus(token, bookingId)
      .then(setStatus)
      .catch(() => {/* silent – thất bại không nghiêm trọng ở trang này */})
      .finally(() => setLoading(false));
  }, [bookingIdStr]);

  // Xây dựng message lỗi
  const errorMessage =
    reason === "cancelled"
      ? "Bạn đã hủy giao dịch. Booking vẫn được giữ – bạn có thể thanh toán lại."
      : errorStr === "invalid_signature"
      ? "Chữ ký không hợp lệ. Có thể đã bị giả mạo giao dịch."
      : errorStr === "amount_mismatch"
      ? "Số tiền giao dịch không khớp. Giao dịch bị từ chối."
      : errorStr === "payment_not_found"
      ? "Không tìm thấy thông tin giao dịch."
      : getErrorMessage(errorCode);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Icon */}
        <div
          className={styles.iconWrap}
          style={{ background: "var(--pcs-brand-primary)" }}
        >
          <span className={styles.icon}>❌</span>
        </div>

        {/* Title */}
        <h1 className={styles.title} style={{ color: "var(--pcs-status-error)" }}>
          Thanh toán không thành công
        </h1>
        <p className={styles.subtitle}>{errorMessage}</p>

        {/* Status từ backend (nếu có) */}
        {!loading && status && (
          <div className={styles.infoCard}>
            {status.amount !== null && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>💰 Số tiền</span>
                <span className={`${styles.infoValue} ${styles.amount}`}>
                  {formatCurrency(Number(status.amount))}
                </span>
              </div>
            )}
            {status.paymentMethod && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Cổng thanh toán</span>
                <span className={styles.infoValue}>
                  📲 VietQR / PayOS
                </span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Trạng thái booking</span>
              <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                {status.bookingStatus === "PendingPayment"
                  ? "Chờ thanh toán"
                  : status.bookingStatus}
              </span>
            </div>
          </div>
        )}

        {/* Notice: booking vẫn còn – có thể thử lại */}
        {status?.bookingStatus === "PendingPayment" && (
          <div className={styles.notice}>
            <span>💡</span>
            <p>
              Booking của bạn vẫn đang <strong>chờ thanh toán</strong> và chưa bị hủy. Bạn có thể{" "}
              <strong>thanh toán lại</strong> từ trang lịch sử booking trước khi hết thời gian giữ slot.
            </p>
          </div>
        )}

        {/* CTA */}
        <Link href="/bookings" className={styles.btnPrimary}>
          Thanh toán lại →
        </Link>
        <Link href="/courts" className={styles.btnSecondary}>
          Đặt sân khác
        </Link>
      </div>
    </div>
  );
}
