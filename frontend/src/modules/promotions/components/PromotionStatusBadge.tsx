"use client";

import type { PromotionStatus } from "@/types/promotion";

interface StatusConfig {
  label: string;
  bg: string;
  color: string;
  dot: string;
}

const statusConfig: Record<PromotionStatus, StatusConfig> = {
  Active: {
    label: "Đang hoạt động",
    bg: "#dcfce7",
    color: "#15803d",
    dot: "#16a34a",
  },
  Inactive: {
    label: "Tạm dừng",
    bg: "#f3f4f6",
    color: "#6b7280",
    dot: "#9ca3af",
  },
  Expired: {
    label: "Đã hết hạn",
    bg: "#fee2e2",
    color: "#dc2626",
    dot: "#dc2626",
  },
};

export default function PromotionStatusBadge({
  status,
}: {
  status: PromotionStatus;
}) {
  const cfg = statusConfig[status] ?? {
    label: status,
    bg: "#f3f4f6",
    color: "#374151",
    dot: "#9ca3af",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: cfg.bg,
        color: cfg.color,
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "0.78rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          display: "block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
