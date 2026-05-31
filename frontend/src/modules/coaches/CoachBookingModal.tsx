"use client";

import { useState } from "react";
import { bookCoach, mockPayBooking } from "@/services/bookingApi";
import type { Booking } from "@/services/bookingApi";
import type { Coach, CoachSchedule } from "@/types/coach";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "../courts/BookingModal.module.css";

type Props = {
  coach: Coach;
  schedule: CoachSchedule;
  bookingDate: string;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
};

type Step = "confirm" | "paying" | "success" | "error";

export default function CoachBookingModal({
  coach,
  schedule,
  bookingDate,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [paymentMethod, setPaymentMethod] = useState<"VNPay" | "Momo">("VNPay");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculate hours duration, e.g. "08:00" to "10:00"
  // Just approximate hourly rate * hours for the UI
  const startH = parseInt(schedule.StartTime.split(":")[0]);
  const endH = parseInt(schedule.EndTime.split(":")[0]);
  const hours = Math.max(1, endH - startH);
  const totalFee = coach.HourlyRate * hours;

  async function handleConfirmBooking() {
    const token = getToken();
    if (!token) {
      setErrorMsg("Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt lịch HLV.");
      setStep("error");
      return;
    }

    setLoading(true);
    try {
      const created = await bookCoach(token, {
        coachId: coach.CoachID,
        bookingDate,
        startTime: schedule.StartTime,
        endTime: schedule.EndTime,
      });
      setBooking(created);
      setStep("paying");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đặt HLV thất bại. Vui lòng thử lại.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleMockPay() {
    if (!booking) return;
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      await mockPayBooking(token, booking.BookingID, paymentMethod);
      setBooking((prev) => prev ? { ...prev, Status: "Confirmed", PaymentMethod: paymentMethod } : prev);
      setStep("success");
      onSuccess({ ...booking, Status: "Confirmed" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Thanh toán thất bại.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>

        {/* ── STEP: Xác nhận ── */}
        {step === "confirm" && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>👨‍🏫</div>
              <h2>Xác nhận thuê HLV</h2>
              <p>Kiểm tra thông tin lịch học trước khi thanh toán</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>👨‍🏫 HLV</span>
                <span className={styles.infoValue}>{coach.FullName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>📅 Ngày</span>
                <span className={styles.infoValue}>
                  {new Date(bookingDate).toLocaleDateString("vi-VN", {
                    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
                  })}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>⏰ Giờ học</span>
                <span className={styles.infoValue}>
                  {schedule.StartTime} – {schedule.EndTime} ({hours} giờ)
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>💰 Phí thuê</span>
                <span className={`${styles.infoValue} ${styles.price}`}>
                  {formatCurrency(totalFee)}
                </span>
              </div>
            </div>

            <div className={styles.notice}>
              <span>⏱</span>
              <p>Sau khi xác nhận, bạn có <strong>10 phút</strong> để hoàn tất thanh toán trước khi khung giờ bị hủy.</p>
            </div>

            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onClose}>
                Hủy bỏ
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác nhận thuê HLV →"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP: Thanh toán ── */}
        {step === "paying" && booking && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>💳</div>
              <h2>Thanh toán Phí HLV</h2>
              <p>Mã booking: <strong>{booking.BookingCode}</strong></p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tổng tiền</span>
                <span className={`${styles.infoValue} ${styles.price}`}>
                  {formatCurrency(Number(booking.TotalAmount))}
                </span>
              </div>
            </div>

            <div className={styles.payMethodSection}>
              <p className={styles.payMethodLabel}>Chọn phương thức thanh toán:</p>
              <div className={styles.payMethods}>
                {(["VNPay", "Momo"] as const).map((method) => (
                  <label
                    key={method}
                    className={`${styles.payMethodCard} ${paymentMethod === method ? styles.payMethodActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                    <span className={styles.payMethodIcon}>
                      {method === "VNPay" ? "🏦" : "📱"}
                    </span>
                    <span>{method}</span>
                  </label>
                ))}
              </div>

              <div className={styles.mockBadge}>
                🔧 Demo mode — Thanh toán giả lập (không trừ tiền thật)
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                Hủy & giữ chỗ
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleMockPay}
                disabled={loading}
              >
                {loading ? "Đang thanh toán..." : `Thanh toán ${paymentMethod} →`}
              </button>
            </div>
          </>
        )}

        {/* ── STEP: Thành công ── */}
        {step === "success" && booking && (
          <>
            <div className={styles.successHeader}>
              <div className={styles.successIcon}>✅</div>
              <h2>Thuê HLV Thành công!</h2>
              <p>Lịch học của bạn đã được xác nhận</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mã booking</span>
                <span className={`${styles.infoValue} ${styles.bookingCode}`}>
                  {booking.BookingCode}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>HLV</span>
                <span className={styles.infoValue}>{coach.FullName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Ngày</span>
                <span className={styles.infoValue}>
                  {new Date(bookingDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Giờ học</span>
                <span className={styles.infoValue}>
                  {schedule.StartTime} – {schedule.EndTime}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thanh toán</span>
                <span className={`${styles.infoValue} ${styles.paidBadge}`}>
                  ✅ {paymentMethod} · {formatCurrency(Number(booking.TotalAmount))}
                </span>
              </div>
            </div>

            <div className={styles.notice}>
              <span>📍</span>
              <p>HLV sẽ liên hệ với bạn hoặc bạn có thể gọi theo số ĐT trong hồ sơ HLV. Vui lòng đến sân trước <strong>10 phút</strong>.</p>
            </div>

            <button className={styles.btnFullSuccess} onClick={onClose}>
              Hoàn thành →
            </button>
          </>
        )}

        {/* ── STEP: Lỗi ── */}
        {step === "error" && (
          <>
            <div className={styles.errorHeader}>
              <div className={styles.errorIcon}>❌</div>
              <h2>Có lỗi xảy ra</h2>
              <p>{errorMsg}</p>
            </div>
            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onClose}>
                Đóng
              </button>
              <button
                className={styles.btnConfirm}
                onClick={() => { setStep("confirm"); setErrorMsg(""); }}
              >
                Thử lại
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
