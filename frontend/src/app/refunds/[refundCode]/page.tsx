"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRefundStatus } from "@/services/refundApi";
import type { RefundRecord } from "@/services/refundApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";

// ── Status config ──────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string; desc: string }> = {
  Requested: {
    label: "Đã yêu cầu",
    bg: "#dbeafe", color: "#1d4ed8",
    icon: "📋",
    desc: "Yêu cầu của bạn đã được ghi nhận. Đang chờ Admin/Manager duyệt.",
  },
  Approved: {
    label: "Đã duyệt",
    bg: "#e0e7ff", color: "#4338ca",
    icon: "✅",
    desc: "Yêu cầu đã được duyệt. Đang chuẩn bị xử lý hoàn tiền.",
  },
  Processing: {
    label: "Đang xử lý",
    bg: "#fef3c7", color: "#b45309",
    icon: "⚙️",
    desc: "Hệ thống đang xử lý hoàn tiền tự động qua MoMo.",
  },
  PendingManual: {
    label: "Chờ chuyển khoản",
    bg: "#fef3c7", color: "#b45309",
    icon: "🏦",
    desc: "Admin/Manager sẽ chuyển khoản thủ công về tài khoản của bạn trong tối đa 7 ngày làm việc (BR-37).",
  },
  Completed: {
    label: "Hoàn tất",
    bg: "#dcfce7", color: "#15803d",
    icon: "🎉",
    desc: "Hoàn tiền đã được thực hiện thành công.",
  },
  Failed: {
    label: "Thất bại",
    bg: "#fee2e2", color: "#b91c1c",
    icon: "❌",
    desc: "Hoàn tiền thất bại. Vui lòng liên hệ Admin/Manager để được hỗ trợ.",
  },
  Rejected: {
    label: "Bị từ chối",
    bg: "#fee2e2", color: "#b91c1c",
    icon: "🚫",
    desc: "Yêu cầu hoàn tiền đã bị từ chối.",
  },
};

const METHOD_INFO: Record<string, { label: string; desc: string }> = {
  Momo: {
    label: "💗 Ví MoMo",
    desc: "Hoàn tiền tự động qua cổng MoMo nếu config đầy đủ, hoặc thủ công nếu thiếu.",
  },
  PayOSManual: {
    label: "🏦 VietQR / PayOS",
    desc: "Hoàn tiền thủ công — Admin/Manager chuyển khoản ngân hàng trực tiếp cho bạn.",
  },
  Manual: {
    label: "🖐️ Thủ công",
    desc: "Xử lý hoàn tiền thủ công bởi Admin/Manager.",
  },
};

// Các status cần polling (còn đang xử lý)
const POLLING_STATUSES = ["Requested", "Approved", "Processing", "PendingManual"];

// ── Main Component ─────────────────────────────────────

export default function RefundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const refundCode = params?.refundCode as string;

  const [refund, setRefund] = useState<RefundRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRefund = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const data = await getRefundStatus(token, refundCode);
      setRefund(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin hoàn tiền.");
    } finally {
      setLoading(false);
    }
  }, [refundCode]);

  useEffect(() => {
    if (!refundCode) return;
    loadRefund();
  }, [loadRefund]);

  // Auto-refresh mỗi 30s nếu status đang xử lý
  useEffect(() => {
    if (!refund || !POLLING_STATUSES.includes(refund.Status)) return;

    const interval = setInterval(() => {
      loadRefund();
    }, 30_000);

    return () => clearInterval(interval);
  }, [refund?.Status, loadRefund]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px", fontFamily: "'Inter',sans-serif" }}>
        <div style={{
          width: "48px", height: "48px",
          border: "3px solid #e2e8f0", borderTopColor: "#7c3aed",
          borderRadius: "50%", animation: "spin 0.9s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ color: "#64748b" }}>Đang tải thông tin hoàn tiền...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "0 20px", textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>😕</div>
        <h2 style={{ color: "#1e293b" }}>Không tìm thấy thông tin</h2>
        <p style={{ color: "#64748b" }}>{error || "Yêu cầu hoàn tiền này không tồn tại hoặc bạn không có quyền xem."}</p>
        <button
          onClick={() => router.push("/refunds")}
          style={{ marginTop: "20px", background: "#7c3aed", color: "#fff", padding: "10px 24px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[refund.Status] || {
    label: refund.Status,
    bg: "#f3f4f6", color: "#6b7280",
    icon: "ℹ️", desc: "",
  };
  const methodInfo = METHOD_INFO[refund.RefundMethod || ""] || { label: refund.RefundMethod || "—", desc: "" };
  const isProcessing = POLLING_STATUSES.includes(refund.Status);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#faf5ff,#f0fdf4)", padding: "40px 0 80px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 20px" }}>
        {/* Back */}
        <button
          onClick={() => router.push("/refunds")}
          style={{ background: "none", border: "none", color: "#7c3aed", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginBottom: "24px", padding: 0 }}
        >
          ← Quay lại danh sách
        </button>

        {/* Main Card */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {/* Status Header */}
          <div style={{ background: statusCfg.bg, padding: "28px 32px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ fontSize: "40px" }}>{statusCfg.icon}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                  <span style={{
                    background: statusCfg.color,
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}>
                    {statusCfg.label}
                  </span>
                  {isProcessing && (
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      🔄 Tự động làm mới mỗi 30 giây
                    </span>
                  )}
                </div>
                <p style={{ color: statusCfg.color, fontSize: "14px", margin: 0, opacity: 0.85 }}>
                  {statusCfg.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "28px 32px" }}>
            {/* RefundCode + Amount */}
            <div style={{ textAlign: "center", marginBottom: "28px", padding: "20px", background: "#f8fafc", borderRadius: "12px" }}>
              <div style={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 800, color: "#7c3aed", marginBottom: "8px" }}>
                {refund.RefundCode || `#${refund.RefundID}`}
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#16a34a" }}>
                {formatCurrency(Number(refund.RefundAmount))}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                Số tiền hoàn tiền
              </div>
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <InfoRow label="📦 Booking ID" value={`#${refund.BookingID}`} />
              <InfoRow label="💳 Payment ID" value={`#${refund.PaymentID}`} />
              <InfoRow label="🏧 Phương thức thanh toán gốc" value={refund.PaymentMethod || "—"} />
              <InfoRow
                label="🔄 Phương thức hoàn tiền"
                value={
                  <span>
                    <strong>{methodInfo.label}</strong>
                    {methodInfo.desc && (
                      <span style={{ display: "block", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        {methodInfo.desc}
                      </span>
                    )}
                  </span>
                }
              />
              <InfoRow
                label="📝 Lý do"
                value={<span style={{ color: "#475569" }}>{refund.Reason || "—"}</span>}
              />
              <InfoRow
                label="🕐 Thời gian yêu cầu"
                value={new Date(refund.RequestedAt).toLocaleString("vi-VN")}
              />
              {refund.ProcessedAt && (
                <InfoRow
                  label="✅ Thời gian xử lý"
                  value={new Date(refund.ProcessedAt).toLocaleString("vi-VN")}
                />
              )}
              {refund.GatewayRefundId && (
                <InfoRow
                  label="🔖 Mã giao dịch hoàn tiền"
                  value={
                    <span style={{ fontFamily: "monospace", color: "#475569" }}>
                      {refund.GatewayRefundId}
                    </span>
                  }
                />
              )}
            </div>

            {/* Policy reminder */}
            <div style={{
              marginTop: "24px",
              padding: "16px",
              background: "#f0fdf4",
              borderRadius: "12px",
              border: "1px solid #bbf7d0",
            }}>
              <p style={{ fontSize: "13px", color: "#15803d", margin: 0, fontWeight: 500 }}>
                ℹ️ <strong>Chính sách hoàn tiền:</strong> Hoàn tiền sẽ được xử lý trong tối đa <strong>7 ngày làm việc (BR-37)</strong>.
                Số tiền được hoàn về đúng tài khoản thanh toán ban đầu (BR-36).
              </p>
            </div>

            {/* Actions */}
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={loadRefund}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#475569",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                🔄 Làm mới
              </button>
              <button
                onClick={() => router.push("/refunds")}
                style={{
                  background: "#7c3aed",
                  border: "none",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Xem tất cả
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}
