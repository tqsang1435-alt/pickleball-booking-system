"use client";

import { useState, useEffect, useCallback } from "react";
import type { Promotion } from "@/types/promotion";
import VoucherCard from "./VoucherCard";
import { getMyPromotions } from "@/services/promotionApi";

interface VoucherListProps {
  token: string;
  bookingAmount?: number;
  onSelect?: (code: string) => void;
}

export default function VoucherList({ token, bookingAmount, onSelect }: VoucherListProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyPromotions(token, bookingAmount);
      setPromotions(data);
    } catch {
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }, [token, bookingAmount]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;
  if (promotions.length === 0) return null;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          color: "var(--pcs-brand-primary)",
          fontSize: "0.83rem",
          cursor: "pointer",
          padding: 0,
          fontWeight: 600,
          textDecoration: "underline",
        }}
      >
        {open ? "▲ Ẩn danh sách voucher" : `▼ Xem ${promotions.length} voucher có thể dùng`}
      </button>

      {open && (
        <div style={{
          marginTop: "0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxHeight: "320px",
          overflowY: "auto",
        }}>
          {promotions.map((p) => (
            <VoucherCard key={p.promotionId} promotion={p} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
