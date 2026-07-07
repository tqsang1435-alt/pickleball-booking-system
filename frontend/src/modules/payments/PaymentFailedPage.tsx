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
  const isTournament = searchParams.get("type") === "tournament";
  const tournamentId = searchParams.get("tournamentId");

  const [status, setStatus] = useState<PaymentStatusResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isTournament) {
      setLoading(false);
      return;
    }
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
  }, [bookingIdStr, isTournament]);

  // Xây dựng message lỗi
  const errorMessage =
    isTournament
      ? reason === "cancelled"
        ? "Bạn đã hủy giao dịch. Lệ phí đăng ký giải đấu chưa được thanh toán thành công. Suất đăng ký của bạn vẫn được giữ tạm thời – bạn có thể thanh toán lại để hoàn tất."
        : "Thanh toán lệ phí giải đấu không thành công. Vui lòng thử lại hoặc liên hệ ban tổ chức."
      : reason === "cancelled"
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
        {!loading && !isTournament && status && (
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

        {/* Notice: booking/tournament vẫn còn – có thể thử lại */}
        {isTournament ? (
          <div className={styles.notice}>
            <span>💡</span>
            <p>
              Suất đăng ký của bạn vẫn đang được giữ tạm thời. Vui lòng thanh toán lại sớm tại trang chi tiết giải đấu để chính thức giữ slot.
            </p>
          </div>
        ) : (
          status?.bookingStatus === "PendingPayment" && (
            <div className={styles.notice}>
              <span>💡</span>
              <p>
                Booking của bạn vẫn đang <strong>chờ thanh toán</strong> và chưa bị hủy. Bạn có thể{" "}
                <strong>thanh toán lại</strong> từ trang lịch sử booking trước khi hết thời gian giữ slot.
              </p>
            </div>
          )
        )}

        {/* CTA */}
        <Link href={isTournament ? (tournamentId ? `/tournaments/${tournamentId}` : "/tournaments") : "/bookings"} className={styles.btnPrimary}>
          Thanh toán lại →
        </Link>
        <Link href={isTournament ? "/tournaments" : "/courts"} className={styles.btnSecondary}>
          {isTournament ? "Xem giải đấu khác" : "Đặt sân khác"}
        </Link>
      </div>
    </div>
  );
}
