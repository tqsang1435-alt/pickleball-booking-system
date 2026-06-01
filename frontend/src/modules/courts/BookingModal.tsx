"use client";

import { useState } from "react";
import { bookCourt, mockPayBooking } from "@/services/bookingApi";
import type { Booking } from "@/services/bookingApi";
import type { CourtSlot } from "@/services/courtApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./BookingModal.module.css";

type Props = {
  courtId: number;
  courtName: string;
  slot: CourtSlot;
  bookingDate: string;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
};

type Step = "confirm" | "paying" | "success" | "error";

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  if (timeStr.includes("T")) {
    return timeStr.split("T")[1].slice(0, 5);
  }
  return timeStr.slice(0, 5);
}

export default function BookingModal({
  courtId,
  courtName,
  slot,
  bookingDate,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("confirm");
  const [paymentMethod, setPaymentMethod] = useState<"VNPay" | "Momo">("VNPay");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const hours =
    (parseInt(formatTime(slot.EndTime)) - parseInt(formatTime(slot.StartTime)));
  const totalFee = slot.Price;

  async function handleConfirmBooking() {
    const token = getToken();
    if (!token) {
      setErrorMsg("Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt sân.");
      setStep("error");
      return;
    }

    setLoading(true);
    try {
      const created = await bookCourt(token, {
        courtId,
        bookingDate,
        startTime: formatTime(slot.StartTime),
        endTime: formatTime(slot.EndTime),
      });
      setBooking(created);
      setStep("paying");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đặt sân thất bại. Vui lòng thử lại.");
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
      // Cập nhật booking status
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
              <div className={styles.headerIcon}>🎾</div>
              <h2>Xác nhận đặt sân</h2>
              <p>Kiểm tra thông tin trước khi tiến hành thanh toán</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>🏟️ Sân</span>
                <span className={styles.infoValue}>{courtName}</span>
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
                <span className={styles.infoLabel}>⏰ Giờ</span>
                <span className={styles.infoValue}>
                  {formatTime(slot.StartTime)} – {formatTime(slot.EndTime)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>💰 Tổng tiền</span>
                <span className={`${styles.infoValue} ${styles.price}`}>
                  {formatCurrency(totalFee)}
                </span>
              </div>
            </div>

            <div className={styles.notice}>
              <span>⏱</span>
              <p>Sau khi đặt, bạn có <strong>10 phút</strong> để hoàn tất thanh toán trước khi slot bị hủy.</p>
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
                {loading ? "Đang xử lý..." : "Xác nhận đặt sân →"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP: Thanh toán ── */}
        {step === "paying" && booking && (
          <>
            <div className={styles.header}>
              <div className={styles.headerIcon}>💳</div>
              <h2>Thanh toán</h2>
              <p><strong>{hours} giờ</strong> - Mã booking: <strong>{booking.BookingCode}</strong></p>
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
                🔧 Demo mode — Thanh toán mock không cần gateway thật
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                Hủy & giữ booking
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
              <h2>Đặt sân thành công!</h2>
              <p>Booking của bạn đã được xác nhận</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mã booking</span>
                <span className={`${styles.infoValue} ${styles.bookingCode}`}>
                  {booking.BookingCode}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Sân</span>
                <span className={styles.infoValue}>{courtName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Ngày</span>
                <span className={styles.infoValue}>
                  {new Date(bookingDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Giờ</span>
                <span className={styles.infoValue}>
                  {slot.StartTime} – {slot.EndTime}
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
              <p>Vui lòng đến sân trước giờ chơi <strong>30 phút</strong> để check-in.</p>
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
