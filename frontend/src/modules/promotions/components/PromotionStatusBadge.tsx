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
    bg: "var(--pcs-status-success-bg)",
    color: "var(--pcs-status-success)",
    dot: "var(--pcs-status-success)",
  },
  Inactive: {
    label: "Tạm dừng",
    bg: "var(--pcs-neutral-100)",
    color: "var(--pcs-neutral-500)",
    dot: "var(--pcs-neutral-400)",
  },
  Expired: {
    label: "Đã hết hạn",
    bg: "var(--pcs-status-error-bg)",
    color: "var(--pcs-status-error)",
    dot: "var(--pcs-status-error)",
  },
};

export default function PromotionStatusBadge({
  status,
}: {
  status: PromotionStatus;
}) {
  const cfg = statusConfig[status] ?? {
    label: status,
    bg: "var(--pcs-neutral-100)",
    color: "var(--pcs-neutral-800)",
    dot: "var(--pcs-neutral-400)",
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
