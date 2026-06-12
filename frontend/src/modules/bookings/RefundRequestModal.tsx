"use client";

import { useState, useEffect } from "react";
import { requestRefund } from "@/services/refundApi";
import type { Booking } from "@/services/bookingApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./CancelBookingModal.module.css";

type Props = {
  booking: Booking;
  onClose: () => void;
  onSuccess: (message: string) => void;
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
      description: "Hủy trong 2–12 giờ — bị trừ 30% phí (BR-34)",
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

const VIETNAM_BANKS = [
  { id: "mbbank", name: "MBBank" },
  { id: "vietcombank", name: "Vietcombank (VCB)" },
  { id: "techcombank", name: "Techcombank" },
  { id: "bidv", name: "BIDV" },
  { id: "vietinbank", name: "VietinBank" },
  { id: "acb", name: "ACB" },
  { id: "vpbank", name: "VPBank" },
  { id: "tpbank", name: "TPBank" },
  { id: "vib", name: "VIB" },
  { id: "hdbank", name: "HDBank" },
  { id: "sacombank", name: "Sacombank" },
  { id: "agribank", name: "Agribank" },
  { id: "msb", name: "MSB" },
  { id: "ocb", name: "OCB" },
  { id: "seabank", name: "SeABank" },
];

// Force recompile
export default function RefundRequestModal({ booking, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState("");
  const [bankId, setBankId] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const refundTier = getRefundTier(booking);
  const refundAmount = Math.round((Number(booking.TotalAmount) * refundTier.percent) / 100);
  const deductAmount = Number(booking.TotalAmount) - refundAmount;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleRequest() {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do hoàn tiền.");
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

    let finalReason = reason.trim();
    if (bankId && accountNo.trim() && accountName.trim()) {
      finalReason = `[Bank: ${bankId}] [STK: ${accountNo.trim()}] [Name: ${accountName.trim()}]\nLý do: ${reason.trim()}`;
    } else if (bankId || accountNo.trim() || accountName.trim()) {
      setError("Vui lòng điền ĐẦY ĐỦ Ngân hàng, Số tài khoản và Tên chủ tài khoản (nếu thanh toán qua mã QR/Chuyển khoản).");
      setLoading(false);
      return;
    }

    try {
      const result = await requestRefund(token, booking.BookingID, finalReason);
      onSuccess(result.message);
    } catch (err: any) {
      setError(err.message || "Yêu cầu hoàn tiền thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="refund-modal-title">
        <div className={styles.header}>
          <div className={styles.headerIcon}>💸</div>
          <div>
            <h2 id="refund-modal-title" className={styles.title}>Yêu Cầu Hoàn Tiền</h2>
            <p className={styles.subtitle}>Mã Booking: <strong>{booking.BookingCode}</strong></p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className={styles.bookingInfo}>
          <div className={styles.infoRow}>
            <span>📅 Ngày chơi</span>
            <strong>{new Date(booking.BookingDate).toLocaleDateString("vi-VN")}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>⏰ Giờ chơi</span>
            <strong>{booking.StartTime} – {booking.EndTime}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>💰 Tổng tiền đã đặt</span>
            <strong className={styles.totalAmount}>{formatCurrency(Number(booking.TotalAmount))}</strong>
          </div>
        </div>

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
              <span>Số tiền dự kiến hoàn</span>
              <strong style={{ color: refundTier.color }}>{formatCurrency(refundAmount)}</strong>
            </div>
            {deductAmount > 0 && (
              <div className={styles.refundRow}>
                <span>Phí bị trừ ({(100 - refundTier.percent)}%)</span>
                <strong className={styles.deductAmount}>– {formatCurrency(deductAmount)}</strong>
              </div>
            )}
          </div>

          <p className={styles.refundNote}>{refundTier.description}</p>
        </div>

        {refundAmount > 0 ? (
          <div className={styles.refundInfo}>
            <span>ℹ️</span>
            <p>Tiền hoàn sẽ được chuyển về tài khoản gốc trong tối đa <strong>7 ngày làm việc</strong>.</p>
          </div>
        ) : (
          <div className={styles.errorBox}>
            Booking của bạn không đủ điều kiện hoàn tiền vì đã quá thời gian quy định (dưới 2 giờ).
          </div>
        )}

        {refundAmount > 0 && (
          <>
            <div className={styles.reasonSection}>
              <label htmlFor="refund-reason" className={styles.reasonLabel}>
                Lý do hoàn tiền <span className={styles.required}>*</span>
              </label>
              <textarea
                id="refund-reason"
                className={styles.reasonInput}
                placeholder="Nhập lý do..."
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(""); }}
                rows={3}
                maxLength={500}
                disabled={loading}
              />
            </div>

            <div className={styles.reasonSection} style={{ marginTop: "16px" }}>
              <label className={styles.reasonLabel} style={{ marginBottom: "12px", display: "block" }}>
                Thông tin nhận tiền (Nếu bạn thanh toán qua chuyển khoản/PayOS)
              </label>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label className={styles.reasonLabel} style={{ fontSize: "13px", fontWeight: 400, opacity: 0.8, marginBottom: "4px", display: "block" }}>Ngân hàng</label>
                  <select
                    className={styles.reasonInput}
                    value={bankId}
                    onChange={(e) => { setBankId(e.target.value); setError(""); }}
                    disabled={loading}
                    style={{ height: "42px", padding: "0 12px" }}
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {VIETNAM_BANKS.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.reasonLabel} style={{ fontSize: "13px", fontWeight: 400, opacity: 0.8, marginBottom: "4px", display: "block" }}>Số tài khoản</label>
                  <input
                    type="text"
                    className={styles.reasonInput}
                    placeholder="VD: 0123456789"
                    value={accountNo}
                    onChange={(e) => { setAccountNo(e.target.value); setError(""); }}
                    disabled={loading}
                    style={{ height: "42px", padding: "0 12px" }}
                  />
                </div>
              </div>

              <div>
                <label className={styles.reasonLabel} style={{ fontSize: "13px", fontWeight: 400, opacity: 0.8, marginBottom: "4px", display: "block" }}>Tên chủ tài khoản (Viết Hoa, Không dấu)</label>
                <input
                  type="text"
                  className={styles.reasonInput}
                  placeholder="VD: NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => { setAccountName(e.target.value.toUpperCase()); setError(""); }}
                  disabled={loading}
                  style={{ height: "42px", padding: "0 12px", textTransform: "uppercase" }}
                />
              </div>
            </div>

            <label className={styles.confirmCheck}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => { setConfirmed(e.target.checked); setError(""); }}
                disabled={loading}
              />
              <span>
                Tôi xác nhận muốn hủy booking và gửi yêu cầu hoàn tiền này.
              </span>
            </label>
          </>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.actions}>
          <button
            className={styles.btnKeep}
            onClick={onClose}
            disabled={loading}
          >
            Đóng
          </button>
          {refundAmount > 0 && (
            <button
              className={styles.btnCancel}
              onClick={handleRequest}
              disabled={loading || !reason.trim() || !confirmed}
            >
              {loading ? (
                <><span className={styles.spinner} /> Đang xử lý...</>
              ) : (
                "Gửi Yêu Cầu"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
