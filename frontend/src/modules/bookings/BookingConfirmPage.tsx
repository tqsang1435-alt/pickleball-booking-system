"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBookingDetail } from "@/services/bookingApi";
import type { Booking } from "@/services/bookingApi";
import { formatCurrency } from "@/utils/formatCurrency";
import StateBox from "@/components/common/StateBox";
import Link from "next/link";
import styles from "./BookingConfirmPage.module.css";

export default function BookingConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const method = searchParams.get("method") || "VNPay";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Countdown timer (in seconds)
  const [timeLeft, setTimeLeft] = useState(600); // Default to 10 minutes
  const [timerExpired, setTimerExpired] = useState(false);

  // Payment simulation state
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError("Thiếu thông tin mã đơn đặt hàng.");
      setLoading(false);
      return;
    }

    let mounted = true;
    async function loadBooking() {
      try {
        setLoading(true);
        const data = await getBookingDetail("", Number(bookingId));
        if (mounted) {
          setBooking(data);
          setSimulatedStatus(data.Status);

          // Calculate remaining hold time
          const createdAt = new Date(data.CreatedAt);
          const holdUntil = new Date(createdAt.getTime() + 10 * 60 * 1000); // 10 minutes
          const diffInSeconds = Math.floor((holdUntil.getTime() - Date.now()) / 1000);

          if (diffInSeconds <= 0) {
            setTimeLeft(0);
            setTimerExpired(true);
          } else {
            setTimeLeft(diffInSeconds);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Không tìm thấy chi tiết đơn đặt hàng.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBooking();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  // Timer countdown logic
  useEffect(() => {
    if (timeLeft <= 0 || paymentSuccess || timerExpired || simulatedStatus === "Paid") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, paymentSuccess, timerExpired, simulatedStatus]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSimulatePayment = () => {
    setIsPaying(true);

    // Simulate 2 seconds network request to mock payment gateway
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      setSimulatedStatus("Paid");
    }, 2500);
  };

  if (loading) {
    return (
      <div className="container section">
        <StateBox variant="loading" title="Đang xác minh giao dịch" description="Vui lòng giữ kết nối ổn định..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container section">
        <StateBox variant="error" title="Giao dịch không tìm thấy" description={error} />
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/courts" className={styles.backBtn}>
            Đặt sân khác
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {paymentSuccess ? (
          /* SUCCESS STATE */
          <div className={`${styles.card} ${styles.successCard}`}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>Thanh toán thành công!</h1>
            <p className={styles.successDesc}>
              Cảm ơn bạn đã đặt sân. Hệ thống đã xác nhận thanh toán thành công cho mã đơn hàng{" "}
              <strong>{booking.BookingCode}</strong>.
            </p>

            <div className={styles.receipt}>
              <div className={styles.receiptRow}>
                <span>Sân chơi:</span>
                <strong>{booking.CourtName}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Thời gian:</span>
                <strong>
                  {booking.StartTime} - {booking.EndTime} ({booking.BookingDate})
                </strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Số tiền thanh toán:</span>
                <strong className={styles.receiptPrice}>{formatCurrency(booking.TotalAmount)}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Phương thức:</span>
                <strong>{method === "VNPay" ? "Cổng VNPay" : "Ví điện tử Momo"}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Trạng thái đơn:</span>
                <span className={styles.paidBadge}>Đã thanh toán</span>
              </div>
            </div>

            <div className={styles.actionRow}>
              <Link href="/profile" className={styles.secondaryBtn}>
                Lịch sử đặt sân
              </Link>
              <Link href="/" className={styles.primaryBtn}>
                Quay về trang chủ
              </Link>
            </div>
          </div>
        ) : timerExpired ? (
          /* EXPIRED STATE */
          <div className={`${styles.card} ${styles.expiredCard}`}>
            <div className={styles.expiredIcon}>!</div>
            <h1 className={styles.expiredTitle}>Giữ chỗ đã hết hạn</h1>
            <p className={styles.expiredDesc}>
              Thời gian giữ chỗ tạm thời (10 phút) cho mã đơn hàng <strong>{booking.BookingCode}</strong> đã hết
              hạn. Slot sân này đã được giải phóng cho người khác đặt.
            </p>
            <div className={styles.actionRow}>
              <Link href="/courts" className={styles.primaryBtn}>
                Xem sân khác
              </Link>
            </div>
          </div>
        ) : (
          /* PENDING PAYMENT STATE */
          <div className={styles.card}>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.badge}>Chờ thanh toán</div>
              <h1 className={styles.title}>Thanh toán đơn hàng</h1>
              <p className={styles.subtitle}>Mã đơn hàng: {booking.BookingCode}</p>
            </div>

            {/* Hold Timer Banner */}
            <div className={styles.timerBanner}>
              <span className={styles.timerIcon}>⏰</span>
              <div>
                <p>Thời gian giữ sân còn lại:</p>
                <strong>{formatTime(timeLeft)}</strong>
              </div>
            </div>

            {/* Invoice Details */}
            <div className={styles.section}>
              <h2>Chi tiết thanh toán</h2>
              <div className={styles.invoiceTable}>
                <div className={styles.invoiceRow}>
                  <span>Sân:</span>
                  <strong>{booking.CourtName} ({booking.Location})</strong>
                </div>
                <div className={styles.invoiceRow}>
                  <span>Ngày chơi:</span>
                  <strong>{booking.BookingDate}</strong>
                </div>
                <div className={styles.invoiceRow}>
                  <span>Khung giờ:</span>
                  <strong>{booking.StartTime} - {booking.EndTime}</strong>
                </div>
                <div className={styles.invoiceRow}>
                  <span>Cổng thanh toán:</span>
                  <strong>{method === "VNPay" ? "Cổng VNPay" : "Ví Momo"}</strong>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.totalBlock}>
                <span>Tổng tiền cần thanh toán:</span>
                <strong>{formatCurrency(booking.TotalAmount)}</strong>
              </div>
            </div>

            {/* Actions */}
            <button
              type="button"
              className={styles.payBtn}
              onClick={handleSimulatePayment}
              disabled={isPaying}
            >
              {isPaying ? "Đang xử lý kết nối..." : `Thanh toán ngay bằng ${method}`}
            </button>

            <Link href="/courts" className={styles.cancelBtn}>
              Hủy bỏ giao dịch
            </Link>
          </div>
        )}

        {/* LOADING SIMULATOR MODAL */}
        {isPaying && (
          <div className={styles.paymentModal}>
            <div className={styles.modalContent}>
              <div className={styles.spinner}></div>
              <h3>Đang kết nối cổng thanh toán {method}</h3>
              <p>Vui lòng không tắt hoặc tải lại trang này...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
