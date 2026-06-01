"use client";

import { useState, useEffect } from "react";
import { cancelBooking } from "@/services/bookingApi";
import type { Booking, CancelResult } from "@/services/bookingApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./CancelBookingModal.module.css";

type Props = {
  booking: Booking;
  onClose: () => void;
  onSuccess: (result: CancelResult) => void;
};

type RefundTier = {
  percent: number;
  label: string;
  description: string;
  color: string;
};

function getRefundTier(booking: Booking): RefundTier & { hoursUntilStart: number } {
  const bookingDateStr = booking.BookingDate
    ? booking.BookingDate.toString().split("T")[0]
    : "";
  const startDateTime = new Date(`${bookingDateStr}T${booking.StartTime}:00`);
  const now = new Date();
  const hoursUntilStart = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart >= 12) {
    return {
      hoursUntilStart,
      percent: 100,
      label: "Hoàn tiền 100%",
      description: "Hủy trước 12 giờ — hoàn toàn bộ số tiền (BR-33)",
      color: "#22c55e",
    };
  } else if (hoursUntilStart >= 2) {
    return {
      hoursUntilStart,
      percent: 70,
      label: "Hoàn tiền 70%",
      description: "Hủy trong 2–12 giờ — bị trừ 30% phí booking (BR-34)",
      color: "#f59e0b",
    };
  } else {
    return {
      hoursUntilStart,
      percent: 0,
      label: "Không hoàn tiền",
      description: "Hủy trong vòng 2 giờ trước giờ chơi — không được hoàn tiền (BR-35)",
      color: "#ef4444",
    };
  }
}

function formatHours(h: number) {
  if (h <= 0) return "Đã qua giờ chơi";
  if (h < 1) return `${Math.round(h * 60)} phút`;
  return `${h.toFixed(1)} giờ`;
}

export default function CancelBookingModal({ booking, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const refundTier = getRefundTier(booking);
  const refundAmount = Math.round((Number(booking.TotalAmount) * refundTier.percent) / 100);
  const deductAmount = Number(booking.TotalAmount) - refundAmount;

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleCancel() {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do hủy booking.");
      return;
    }
    if (!confirmed) {
      setError("Vui lòng xác nhận rằng bạn hiểu chính sách hoàn tiền.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await cancelBooking(token, booking.BookingID, reason.trim());
      onSuccess(result);
    } catch (err: any) {
      setError(err.message || "Hủy booking thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const isPaidOrConfirmed = ["Confirmed", "CheckedIn"].includes(booking.Status);

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>⚠️</div>
          <div>
            <h2 id="cancel-modal-title" className={styles.title}>Hủy Booking</h2>
            <p className={styles.subtitle}>Mã: <strong>{booking.BookingCode}</strong></p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {/* Booking Summary */}
        <div className={styles.bookingInfo}>
          <div className={styles.infoRow}>
            <span>📅 Ngày chơi</span>
            <strong>{new Date(booking.BookingDate).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>⏰ Giờ chơi</span>
            <strong>{booking.StartTime} – {booking.EndTime}</strong>
          </div>
          {booking.CourtName && (
            <div className={styles.infoRow}>
              <span>🏟️ Sân</span>
              <strong>{booking.CourtName}</strong>
            </div>
          )}
          {booking.CoachName && (
            <div className={styles.infoRow}>
              <span>👨‍🏫 HLV</span>
              <strong>{booking.CoachName}</strong>
            </div>
          )}
          <div className={styles.infoRow}>
            <span>💰 Tổng tiền đã đặt</span>
            <strong className={styles.totalAmount}>{formatCurrency(Number(booking.TotalAmount))}</strong>
          </div>
        </div>

        {/* Refund Policy Preview */}
        <div className={styles.refundPolicy} style={{ borderColor: refundTier.color }}>
          <div className={styles.refundHeader}>
            <span className={styles.refundIcon}>⏱️</span>
            <div>
              <div className={styles.timeUntilStart}>
                Còn <strong>{formatHours(refundTier.hoursUntilStart)}</strong> trước giờ chơi
              </div>
              <div className={styles.refundLabel} style={{ color: refundTier.color }}>
                {refundTier.label}
              </div>
            </div>
          </div>

          <div className={styles.refundBreakdown}>
            <div className={styles.refundRow}>
              <span>Số tiền hoàn lại</span>
              <strong style={{ color: refundTier.color }}>{formatCurrency(refundAmount)}</strong>
            </div>
            {deductAmount > 0 && (
              <div className={styles.refundRow}>
                <span>Phí bị trừ (30%)</span>
                <strong className={styles.deductAmount}>– {formatCurrency(deductAmount)}</strong>
              </div>
            )}
          </div>

          <p className={styles.refundNote}>{refundTier.description}</p>

          {/* Progress bar */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${refundTier.percent}%`, backgroundColor: refundTier.color }}
            />
          </div>
          <div className={styles.progressLabels}>
            <span>0%</span>
            <span style={{ color: refundTier.color }}>Hoàn {refundTier.percent}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Refund info for paid bookings */}
        {isPaidOrConfirmed && refundAmount > 0 && (
          <div className={styles.refundInfo}>
            <span>ℹ️</span>
            <p>Tiền hoàn sẽ được chuyển về tài khoản gốc trong tối đa <strong>7 ngày làm việc</strong> (BR-37).</p>
          </div>
        )}

        {/* Reason input */}
        <div className={styles.reasonSection}>
          <label htmlFor="cancel-reason" className={styles.reasonLabel}>
            Lý do hủy booking <span className={styles.required}>*</span>
          </label>
          <textarea
            id="cancel-reason"
            className={styles.reasonInput}
            placeholder="Nhập lý do hủy (bắt buộc)..."
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            rows={3}
            maxLength={500}
            disabled={loading}
          />
          <div className={styles.charCount}>{reason.length}/500</div>
        </div>

        {/* Confirm checkbox */}
        <label className={styles.confirmCheck}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => { setConfirmed(e.target.checked); setError(""); }}
            disabled={loading}
          />
          <span>
            Tôi hiểu chính sách hoàn tiền và xác nhận muốn hủy booking này.
          </span>
        </label>

        {error && <div className={styles.errorBox}>{error}</div>}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.btnKeep}
            onClick={onClose}
            disabled={loading}
          >
            Giữ booking
          </button>
          <button
            className={styles.btnCancel}
            onClick={handleCancel}
            disabled={loading || !reason.trim() || !confirmed}
          >
            {loading ? (
              <><span className={styles.spinner} /> Đang hủy...</>
            ) : (
              `Xác nhận hủy${refundAmount > 0 ? ` — Hoàn ${formatCurrency(refundAmount)}` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
