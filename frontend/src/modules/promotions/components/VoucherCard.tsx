"use client";

import { useState } from "react";
import type { Promotion } from "@/types/promotion";

interface VoucherCardProps {
  promotion: Promotion;
  onSelect?: (code: string) => void;
}

export default function VoucherCard({ promotion, onSelect }: VoucherCardProps) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(promotion.promotionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const endDate = promotion.endDate
    ? new Date(promotion.endDate).toLocaleDateString("vi-VN")
    : "";

  const discountLabel =
    promotion.discountType === "Percent"
      ? `Giảm ${promotion.discountValue}%`
      : `Giảm ${promotion.discountValue.toLocaleString("vi-VN")}đ`;

  return (
    <div style={{
      border: "1.5px solid var(--pcs-brand-primary-border)",
      borderRadius: "12px",
      overflow: "hidden",
      background: "var(--pcs-brand-primary-light)",
      display: "flex",
      gap: 0,
    }}>
      {/* Nhãn giảm giá */}
      <div style={{
        width: "90px",
        minWidth: "90px",
        background: "var(--pcs-brand-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        padding: "0.75rem 0.5rem",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>
          {promotion.discountType === "Percent"
            ? `${promotion.discountValue}%`
            : `${(promotion.discountValue / 1000).toFixed(0)}K`}
        </div>
        <div style={{ fontSize: "0.68rem", marginTop: "2px", opacity: 0.9 }}>
          {promotion.discountType === "Percent" ? "giảm" : "giảm"}
        </div>
      </div>

      {/* Thông tin */}
      <div style={{ flex: 1, padding: "0.75rem 1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--pcs-brand-primary)" }}>
          {promotion.promotionName}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--pcs-brand-primary)", margin: "2px 0" }}>
          {discountLabel}
          {promotion.maxDiscountAmount
            ? ` (tối đa ${promotion.maxDiscountAmount.toLocaleString("vi-VN")}đ)`
            : ""}
        </div>
        {promotion.minBookingAmount != null && promotion.minBookingAmount > 0 && (
          <div style={{ fontSize: "0.72rem", color: "var(--pcs-brand-primary)", opacity: 0.8 }}>
            Đơn tối thiểu {promotion.minBookingAmount.toLocaleString("vi-VN")}đ
          </div>
        )}
        {endDate && (
          <div style={{ fontSize: "0.72rem", color: "var(--pcs-neutral-400)", marginTop: "2px" }}>
            HSD: {endDate}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <span style={{
            background: "var(--pcs-brand-primary-light)",
            color: "var(--pcs-brand-primary)",
            border: "1px solid var(--pcs-brand-primary-border)",
            borderRadius: "6px",
            padding: "2px 8px",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "1px",
          }}>
            {promotion.promotionCode}
          </span>
          <button
            onClick={copyCode}
            style={{
              background: "none",
              border: "1px solid var(--pcs-brand-primary)",
              borderRadius: "6px",
              color: "var(--pcs-brand-primary)",
              padding: "2px 8px",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            {copied ? "✓ Đã copy" : "Copy"}
          </button>
          {onSelect && (
            <button
              onClick={() => onSelect(promotion.promotionCode)}
              style={{
                background: "var(--pcs-brand-primary)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                padding: "2px 10px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Dùng ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
