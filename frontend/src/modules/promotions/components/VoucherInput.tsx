"use client";

import { useState } from "react";
import type { PromotionValidateResult } from "@/types/promotion";

interface VoucherInputProps {
  token: string;
  bookingId: number;
  appliedPromotion: PromotionValidateResult | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => Promise<void>;
  loading?: boolean;
}

export default function VoucherInput({
  appliedPromotion,
  onApply,
  onRemove,
  loading = false,
}: VoucherInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    if (!code.trim()) return;
    setError("");
    setApplying(true);
    try {
      await onApply(code.trim().toUpperCase());
      setCode("");
    } catch (err: any) {
      setError(err.message || "Voucher không hợp lệ");
    } finally {
      setApplying(false);
    }
  }

  async function handleRemove() {
    setError("");
    try {
      await onRemove();
    } catch (err: any) {
      setError(err.message || "Không thể gỡ voucher");
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <label style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem", display: "block" }}>
        🎟️ Mã voucher
      </label>

      {appliedPromotion ? (
        // Đã apply – hiển thị thông tin giảm giá
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "1.5px solid #22c55e",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <div>
            <div style={{ fontWeight: 700, color: "#16a34a", fontSize: "0.95rem" }}>
              ✅ {appliedPromotion.promotionCode}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#15803d" }}>
              {appliedPromotion.promotionName} –{" "}
              Giảm{" "}
              <strong>{appliedPromotion.discountAmount.toLocaleString("vi-VN")}đ</strong>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            style={{
              background: "none",
              border: "1px solid #dc2626",
              borderRadius: "6px",
              color: "#dc2626",
              padding: "4px 10px",
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Gỡ voucher
          </button>
        </div>
      ) : (
        // Chưa apply – hiện ô nhập
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="Nhập mã voucher"
            disabled={applying || loading}
            style={{
              flex: 1,
              padding: "0.55rem 0.75rem",
              border: "1.5px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "0.9rem",
              outline: "none",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          />
          <button
            onClick={handleApply}
            disabled={applying || loading || !code.trim()}
            style={{
              padding: "0.55rem 1.1rem",
              background: applying || !code.trim() ? "#9ca3af" : "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: applying || !code.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {applying ? "Đang áp dụng..." : "Áp dụng"}
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "0.4rem" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
