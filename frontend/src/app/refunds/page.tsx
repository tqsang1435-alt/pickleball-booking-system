"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getMyRefunds } from "@/services/refundApi";
import type { RefundRecord, RefundStatus } from "@/services/refundApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";

// ── Status helpers ─────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  Requested: "Đã yêu cầu",
  Approved: "Đã duyệt",
  Processing: "Đang xử lý",
  PendingManual: "Chờ chuyển khoản",
  Completed: "Hoàn tất",
  Failed: "Thất bại",
  Rejected: "Bị từ chối",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Requested: { bg: "#dbeafe", color: "#1d4ed8" },
  Approved: { bg: "#e0e7ff", color: "#4338ca" },
  Processing: { bg: "#fef3c7", color: "#b45309" },
  PendingManual: { bg: "#fef3c7", color: "#b45309" },
  Completed: { bg: "#dcfce7", color: "#15803d" },
  Failed: { bg: "#fee2e2", color: "#b91c1c" },
  Rejected: { bg: "#fee2e2", color: "#b91c1c" },
};

const METHOD_LABELS: Record<string, { label: string; note: string }> = {
  Momo: { label: "💗 Ví MoMo", note: "Hoàn tự động" },
  PayOSManual: { label: "🏦 VietQR/PayOS", note: "Chuyển khoản thủ công" },
  Manual: { label: "🖐️ Thủ công", note: "" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────

export default function MyRefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function loadRefunds() {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const data = await getMyRefunds(token);
        setRefunds(data);
      } catch (err: any) {
        setError(err.message || "Lỗi tải lịch sử hoàn tiền.");
      } finally {
        setLoading(false);
      }
    }
    loadRefunds();
  }, []);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return refunds;
    return refunds.filter((r) => r.Status === filterStatus);
  }, [refunds, filterStatus]);

  const stats = useMemo(() => ({
    total: refunds.length,
    pending: refunds.filter((r) => ["Requested", "Approved", "Processing", "PendingManual"].includes(r.Status)).length,
    completed: refunds.filter((r) => r.Status === "Completed").length,
    totalRefunded: refunds
      .filter((r) => r.Status === "Completed")
      .reduce((sum, r) => sum + Number(r.RefundAmount), 0),
  }), [refunds]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#fff7ed,#fff1f2)", padding: "40px 0 80px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
              💸 Lịch sử Hoàn tiền
            </h1>
            <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
              Theo dõi các yêu cầu hoàn tiền của bạn
            </p>
          </div>
          <button
            onClick={() => router.push("/profile")}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              color: "#475569",
              padding: "8px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            ← Về hồ sơ
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Tổng yêu cầu", value: stats.total, color: "#1e293b" },
            { label: "Đang xử lý", value: stats.pending, color: "#d97706" },
            { label: "Hoàn tất", value: stats.completed, color: "#16a34a" },
            { label: "Đã hoàn tiền", value: formatCurrency(stats.totalRefunded), color: "#7c3aed", small: true },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "20px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: s.small ? "16px" : "24px", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#475569" }}>Lọc theo:</span>
          {["all", "Requested", "PendingManual", "Processing", "Completed", "Failed", "Rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                background: filterStatus === s ? "#7c3aed" : "#f1f5f9",
                color: filterStatus === s ? "#fff" : "#475569",
                transition: "all 0.15s",
              }}
            >
              {s === "all" ? "Tất cả" : (STATUS_LABELS[s] || s)}
              {s !== "all" && ` (${refunds.filter(r => r.Status === s).length})`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#64748b" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
            <p>Đang tải...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💸</div>
            <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>
              {filterStatus === "all" ? "Chưa có yêu cầu hoàn tiền nào" : `Không có yêu cầu nào ở trạng thái "${STATUS_LABELS[filterStatus] || filterStatus}"`}
            </h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Khi bạn hủy booking và yêu cầu hoàn tiền, lịch sử sẽ xuất hiện tại đây.
            </p>
            <button
              onClick={() => router.push("/bookings")}
              style={{ marginTop: "16px", background: "#7c3aed", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Xem lịch sử booking
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Mã Refund", "Ngày yêu cầu", "Phương thức", "Số tiền hoàn", "Lý do", "Trạng thái", "Xử lý lúc"].map((h) => (
                      <th key={h} style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 700, color: "#64748b", textAlign: "left", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const methodInfo = METHOD_LABELS[r.RefundMethod || ""] || { label: r.RefundMethod || "—", note: "" };
                    return (
                      <tr
                        key={r.RefundID}
                        onClick={() => r.RefundCode && router.push(`/refunds/${r.RefundCode}`)}
                        style={{ borderBottom: "1px solid #e2e8f0", cursor: r.RefundCode ? "pointer" : "default", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", fontSize: "13px" }}>
                            {r.RefundCode || `#${r.RefundID}`}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                            Booking #{r.BookingID}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#475569" }}>
                          {new Date(r.RequestedAt).toLocaleString("vi-VN")}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{methodInfo.label}</div>
                          {methodInfo.note && (
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{methodInfo.note}</div>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontWeight: 700, color: "#16a34a", fontSize: "14px" }}>
                            {formatCurrency(Number(r.RefundAmount))}
                          </div>
                          {r.PaymentMethod && (
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>qua {r.PaymentMethod}</div>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px", maxWidth: "200px" }}>
                          <div style={{ fontSize: "13px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.Reason || ""}>
                            {r.Reason || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <StatusBadge status={r.Status} />
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>
                          {r.ProcessedAt ? new Date(r.ProcessedAt).toLocaleString("vi-VN") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
