"use client";

import { useEffect, useState } from "react";
import { getMyPromotions } from "@/services/promotionApi";
import VoucherCard from "@/modules/promotions/components/VoucherCard";
import type { Promotion } from "@/types/promotion";
import { getToken } from "@/utils/authStorage";

export default function MyPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getMyPromotions(token)
      .then(setPromotions)
      .catch(() => setPromotions([]))
      .finally(() => setLoading(false));
  }, []);

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={{
      maxWidth: "640px",
      margin: "0 auto",
      padding: "2rem 1rem",
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #7c3aed, #9333ea)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "0.25rem",
        }}>
          🎟️ Voucher của bạn
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          Các mã ưu đãi dành riêng cho bạn. Sao chép mã và nhập khi đặt sân.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
          Đang tải...
        </div>
      ) : promotions.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          background: "#f9fafb",
          borderRadius: "16px",
          color: "#6b7280",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎁</div>
          <div style={{ fontWeight: 600 }}>Bạn chưa có voucher nào</div>
          <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Voucher ưu đãi sẽ xuất hiện ở đây khi được cấp
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {promotions.map((promo) => (
            <VoucherCard
              key={promo.promotionId}
              promotion={promo}
              onSelect={handleCopy}
            />
          ))}
        </div>
      )}

      {copied && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1f2937",
          color: "white",
          padding: "0.5rem 1.25rem",
          borderRadius: "999px",
          fontSize: "0.88rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          zIndex: 9999,
        }}>
          ✓ Đã copy mã {copied}
        </div>
      )}
    </div>
  );
}
