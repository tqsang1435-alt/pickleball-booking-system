"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getManagerRefunds,
  approveRefund,
  processRefund,
  completeManualRefund,
  rejectRefund,
} from "@/services/refundApi";
import type { RefundManagerRecord } from "@/services/refundApi";
import { getToken } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";

// ── Status & Method config ─────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  Requested: "Đã yêu cầu",
  Approved: "Đã duyệt",
  Processing: "Đang xử lý",
  PendingManual: "Chờ chuyển khoản",
  Completed: "Hoàn tất",
  Failed: "Thất bại",
  Rejected: "Từ chối",
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

// ── Modal types ────────────────────────────────────────

type ModalType = "completeManual" | "reject" | null;

interface ModalState {
  type: ModalType;
  refundCode: string;
  refundAmount?: number;
  paymentMethod?: string;
  bookingCode?: string;
  reason?: string;
}

// ── Sub-components ─────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: "4px 10px", borderRadius: "12px",
      fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ActionBtn({
  label, onClick, color = "#6b7280", disabled = false,
}: {
  label: string; onClick: () => void; color?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color, color: "#fff",
        padding: "6px 12px", border: "none", borderRadius: "8px",
        fontSize: "12px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", transition: "opacity 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ── Complete Manual Modal ──────────────────────────────

function CompleteManualModal({
  refundCode,
  refundAmount,
  bookingCode,
  reason,
  onConfirm,
  onClose,
  loading,
}: {
  refundCode: string;
  refundAmount?: number;
  bookingCode?: string;
  reason?: string;
  onConfirm: (file: File) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [billImage, setBillImage] = useState<File | null>(null);
  const bankMatch = reason?.match(/\[Bank:\s*(.*?)\]/);
  const stkMatch = reason?.match(/\[STK:\s*(.*?)\]/);
  const nameMatch = reason?.match(/\[Name:\s*(.*?)\]/);

  const bankId = bankMatch ? bankMatch[1] : "";
  const accountNo = stkMatch ? stkMatch[1] : "";
  const accountName = nameMatch ? nameMatch[1] : "";

  const qrUrl = (bankId && accountNo && refundAmount)
    ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${refundAmount}&addInfo=${encodeURIComponent(`Hoan tien ${bookingCode || refundCode}`)}&accountName=${encodeURIComponent(accountName)}`
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", maxWidth: "480px", width: "100%", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 8px", color: "#1e293b" }}>✅ Xác nhận Chuyển khoản Thủ công</h3>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px" }}>
          Mã refund: <strong style={{ color: "#7c3aed" }}>{refundCode}</strong>
          {bookingCode && <> — Booking: <strong style={{ color: "#2563eb" }}>{bookingCode}</strong></>}
          {refundAmount && <> — Số tiền: <strong style={{ color: "#16a34a" }}>{formatCurrency(refundAmount)}</strong></>}
        </p>

        {reason && (
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <div style={{ flex: 1, background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>Chi tiết lý do / Thông tin nhận tiền:</div>
              <div style={{ fontSize: "14px", color: "#1e293b", whiteSpace: "pre-wrap" }}>
                {reason.replace(/\[Bank:.*?\]|\[STK:.*?\]|\[Name:.*?\]/g, "").trim() || reason}
              </div>
              
              {bankId && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Ngân hàng: <strong>{bankId}</strong></div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Số tài khoản: <strong style={{ color: "#2563eb", fontSize: "14px" }}>{accountNo}</strong></div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Tên người nhận: <strong>{accountName}</strong></div>
                </div>
              )}
            </div>

            {qrUrl && (
              <div style={{ width: "160px", flexShrink: 0, textAlign: "center" }}>
                <div style={{ border: "2px dashed #3b82f6", borderRadius: "12px", padding: "8px", background: "#eff6ff" }}>
                  <img src={qrUrl} alt="VietQR" style={{ width: "100%", height: "auto", borderRadius: "8px", mixBlendMode: "multiply" }} />
                  <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 600, marginTop: "4px" }}>Quét để chuyển khoản</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: "13px", color: "#374151", marginBottom: "6px" }}>
            Tải lên ảnh Bill chuyển khoản <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBillImage(e.target.files?.[0] || null)}
            disabled={loading}
            style={{ width: "100%", padding: "10px", border: "1px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}
          />
        </div>

        <div style={{ background: "#fef3c7", borderRadius: "8px", padding: "12px", marginBottom: "20px", fontSize: "13px", color: "#b45309" }}>
          <strong>⚠️ Lưu ý:</strong> Đây là hoàn tiền thủ công. Bạn phải chuyển khoản ngân hàng cho khách, sau đó bắt buộc tải ảnh bill lên và xác nhận.
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer", fontWeight: 600 }}
          >
            Hủy
          </button>
          <button
            onClick={() => billImage && onConfirm(billImage)}
            disabled={loading || !billImage}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#fff", cursor: (loading || !billImage) ? "not-allowed" : "pointer", fontWeight: 600, opacity: (loading || !billImage) ? 0.6 : 1 }}
          >
            {loading ? "Đang xử lý..." : "✅ Xác nhận hoàn tất"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ───────────────────────────────────────

function RejectModal({
  refundCode,
  bookingCode,
  reason: refundReason,
  onConfirm,
  onClose,
  loading,
}: {
  refundCode: string;
  bookingCode?: string;
  reason?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", maxWidth: "440px", width: "100%", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 8px", color: "#1e293b" }}>🚫 Từ chối Hoàn tiền</h3>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px" }}>
          Mã refund: <strong style={{ color: "#7c3aed" }}>{refundCode}</strong>
          {bookingCode && <> — Booking: <strong style={{ color: "#2563eb" }}>{bookingCode}</strong></>}
        </p>

        {refundReason && (
          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>Chi tiết lý do / STK từ khách:</div>
            <div style={{ fontSize: "14px", color: "#1e293b", whiteSpace: "pre-wrap" }}>{refundReason}</div>
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: "13px", color: "#374151", marginBottom: "6px" }}>
            Lý do từ chối <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Nhập lý do từ chối hoàn tiền (bắt buộc)..."
            disabled={loading}
            style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer", fontWeight: 600 }}
          >
            Hủy
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={loading || !reason.trim()}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", cursor: (loading || !reason.trim()) ? "not-allowed" : "pointer", fontWeight: 600, opacity: (loading || !reason.trim()) ? 0.6 : 1 }}
          >
            {loading ? "Đang xử lý..." : "🚫 Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function AdminRefundPage() {
  const [refunds, setRefunds] = useState<RefundManagerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  // Modals
  const [modal, setModal] = useState<ModalState>({ type: null, refundCode: "" });

  useEffect(() => {
    // Lấy query param 'search' (VD: từ trang Booking chuyển sang)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get("search");
      if (searchParam) {
        setSearchText(searchParam);
      }
    }
    loadRefunds();
  }, []);

  async function loadRefunds() {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      const data = await getManagerRefunds(token);
      setRefunds(data);
    } catch (err: any) {
      setError(err.message || "Lỗi tải danh sách hoàn tiền.");
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    loadRefunds();
    setTimeout(() => setSuccess(""), 6000);
  }

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(""), 6000);
  }

  async function handleCompleteManualConfirm(file: File) {
    if (modal.type !== "completeManual" || !modal.refundCode) return;
    setActionLoading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("refundCode", modal.refundCode);
      formData.append("billImage", file);

      const res = await completeManualRefund(token!, formData);
      const bookingStr = modal.bookingCode ? `mã booking ${modal.bookingCode}` : `mã refund ${modal.refundCode}`;
      setModal({ type: null, refundCode: "" });
      showSuccess(`Đã hoàn tiền ${bookingStr} thành công`);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove(refundCode: string) {
    if (!confirm(`Duyệt yêu cầu hoàn tiền ${refundCode}?`)) return;
    setActionLoading(true);
    try {
      const res = await approveRefund(getToken()!, refundCode);
      showSuccess(res.message);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleProcessMomo(refundCode: string) {
    if (!confirm(`Gọi MoMo API để hoàn tiền tự động cho ${refundCode}?\n\nHệ thống sẽ hoàn tiền nếu cấu hình MoMo gateway đầy đủ.`)) return;
    setActionLoading(true);
    try {
      const res = await processRefund(getToken()!, refundCode);
      showSuccess(res.message);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setActionLoading(false);
    }
  }


  async function handleRejectConfirm(reason: string) {
    setActionLoading(true);
    try {
      const res = await rejectRefund(getToken()!, modal.refundCode, reason);
      setModal({ type: null, refundCode: "" });
      showSuccess(res.message);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = refunds;
    if (filterStatus !== "all") {
      if (filterStatus === "Processing") {
        result = result.filter((r) => ["Processing", "PendingManual"].includes(r.Status));
      } else if (filterStatus === "Requested") {
        result = result.filter((r) => ["Requested", "Approved"].includes(r.Status));
      } else {
        result = result.filter((r) => r.Status === filterStatus);
      }
    }
    if (filterMethod !== "all") result = result.filter((r) => r.PaymentMethod === filterMethod);
    if (filterDateFrom) result = result.filter((r) => new Date(r.RequestedAt).toISOString().split("T")[0] >= filterDateFrom);
    if (filterDateTo) result = result.filter((r) => new Date(r.RequestedAt).toISOString().split("T")[0] <= filterDateTo);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((r) => 
        (r.RefundCode || "").toLowerCase().includes(q) ||
        (r.BookingCode || "").toLowerCase().includes(q) ||
        (r.PlayerName || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [refunds, filterStatus, filterMethod, filterDateFrom, filterDateTo, searchText]);

  const counts = useMemo(() => ({
    pending: refunds.filter((r) => ["Requested", "Approved"].includes(r.Status)).length,
    processing: refunds.filter((r) => ["Processing", "PendingManual"].includes(r.Status)).length,
    completed: refunds.filter((r) => r.Status === "Completed").length,
    totalRefunded: refunds.filter((r) => r.Status === "Completed").reduce((s, r) => s + Number(r.RefundAmount), 0),
  }), [refunds]);

  return (
    <div style={{ padding: "32px", fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Modals */}
      {modal.type === "completeManual" && (
        <CompleteManualModal
          refundCode={modal.refundCode}
          refundAmount={modal.refundAmount}
          bookingCode={modal.bookingCode}
          reason={modal.reason}
          onConfirm={handleCompleteManualConfirm}
          onClose={() => setModal({ type: null, refundCode: "" })}
          loading={actionLoading}
        />
      )}
      {modal.type === "reject" && (
        <RejectModal
          refundCode={modal.refundCode}
          onConfirm={handleRejectConfirm}
          onClose={() => setModal({ type: null, refundCode: "" })}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>
          💸 Quản lý Hoàn tiền
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
          Duyệt và xử lý yêu cầu hoàn tiền từ người chơi
        </p>
      </div>

      {/* Toast */}
      {success && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontWeight: 600, border: "1px solid #bbf7d0" }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontWeight: 600, border: "1px solid #fecaca" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Chờ duyệt", value: counts.pending, color: "#2563eb" },
          { label: "Đang xử lý", value: counts.processing, color: "#b45309" },
          { label: "Hoàn tất", value: counts.completed, color: "#16a34a" },
          { label: "Tổng đã hoàn", value: formatCurrency(counts.totalRefunded), color: "#7c3aed", small: true },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
            padding: "16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: s.small ? "16px" : "24px", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px",
        padding: "16px 20px", marginBottom: "20px",
        display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="🔍 Tìm mã booking, mã refund, tên khách..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "100%", padding: "7px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Từ:</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Đến:</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155" }}
          >
            <option value="all">Tất cả ({refunds.length})</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v} ({refunds.filter((r) => r.Status === k).length})</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Thanh toán:</label>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155" }}
          >
            <option value="all">Tất cả</option>
            <option value="Momo">💗 MoMo</option>
            <option value="PayOS">🏦 VietQR/PayOS</option>
          </select>
        </div>

        <button
          onClick={() => {
            setFilterStatus("all");
            setFilterMethod("all");
            setFilterDateFrom("");
            setFilterDateTo("");
            setSearchText("");
            loadRefunds();
          }}
          style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #e2e8f0", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p>Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", color: "#64748b" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <p>Không có yêu cầu hoàn tiền nào.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Mã Refund", "Khách hàng", "Số tiền", "Phương thức", "Lý do", "Trạng thái", "Ngày yêu cầu", "Hành động"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 700, color: "#64748b", textAlign: "left", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.RefundID} style={{ borderBottom: "1px solid #e2e8f0" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    {/* Mã Refund */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", fontSize: "12px" }}>
                        {r.RefundCode || `#${r.RefundID}`}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        Booking #{r.BookingID} {r.BookingCode && `(${r.BookingCode})`}
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{r.PlayerName || "—"}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{r.PlayerEmail || ""}</div>
                    </td>

                    {/* Số tiền */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "14px" }}>
                        {formatCurrency(Number(r.RefundAmount))}
                      </div>
                    </td>

                    {/* Phương thức */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                        {r.PaymentMethod === "Momo" ? "💗 MoMo" : "🏦 VietQR/PayOS"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        {r.RefundMethod === "Momo"
                          ? "⚡ Hoàn tự động"
                          : "🖐️ Chuyển khoản thủ công"}
                      </div>
                    </td>

                    {/* Lý do */}
                    <td style={{ padding: "12px 14px", maxWidth: "250px" }}>
                      <div style={{ fontSize: "13px", color: "#475569", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {r.Reason || "—"}
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={r.Status} />
                    </td>

                    {/* Ngày yêu cầu */}
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(r.RequestedAt).toLocaleString("vi-VN")}
                      {r.ProcessedAt && (
                        <div style={{ marginTop: "2px", color: "#94a3b8" }}>
                          ✅ {new Date(r.ProcessedAt).toLocaleString("vi-VN")}
                        </div>
                      )}
                    </td>

                    {/* Hành động */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {/* Approve: chỉ khi Requested */}
                        {r.Status === "Requested" && (
                          <ActionBtn
                            label="✅ Duyệt"
                            color="#2563eb"
                            onClick={() => handleApprove(r.RefundCode!)}
                            disabled={actionLoading}
                          />
                        )}

                        {/* Process MoMo: khi Momo + Processing hoặc PendingManual */}
                        {r.RefundMethod === "Momo" && ["Processing", "PendingManual"].includes(r.Status) && (
                          <ActionBtn
                            label="💗 Gửi MoMo"
                            color="#a855f7"
                            onClick={() => handleProcessMomo(r.RefundCode!)}
                            disabled={actionLoading}
                          />
                        )}

                        {/* Complete Manual: PayOS + PendingManual hoặc Processing */}
                        {r.RefundMethod !== "Momo" && ["PendingManual", "Processing"].includes(r.Status) && (
                          <ActionBtn
                            label="🏦 Hoàn tất thủ công"
                            color="#16a34a"
                            onClick={() => setModal({
                              type: "completeManual",
                              refundCode: r.RefundCode!,
                              refundAmount: Number(r.RefundAmount),
                              bookingCode: r.BookingCode ?? undefined,
                              reason: r.Reason ?? undefined,
                              paymentMethod: r.PaymentMethod,
                            })}
                            disabled={actionLoading}
                          />
                        )}

                        {/* Reject: Requested, Approved, Processing, PendingManual */}
                        {["Requested", "Approved", "Processing", "PendingManual"].includes(r.Status) && (
                          <ActionBtn
                            label="🚫 Từ chối"
                            color="#dc2626"
                            onClick={() => setModal({
                              type: "reject",
                              refundCode: r.RefundCode!,
                              bookingCode: r.BookingCode ?? undefined,
                              reason: r.Reason ?? undefined,
                            })}
                            disabled={actionLoading}
                          />
                        )}

                        {["Completed", "Failed", "Rejected"].includes(r.Status) && (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", fontSize: "13px", color: "#64748b", background: "#f8fafc" }}>
            Hiển thị {filtered.length}/{refunds.length} yêu cầu
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: "24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>📌 Hướng dẫn xử lý:</h4>
        <div style={{ display: "grid", gap: "8px", fontSize: "13px", color: "#475569" }}>
          <div>• <strong>💗 MoMo:</strong> Hệ thống tự động hoàn tiền nếu cấu hình MoMo gateway đầy đủ. Bấm "Duyệt" → "Gửi MoMo".</div>
          <div>• <strong>🏦 VietQR/PayOS:</strong> Phải chuyển khoản ngân hàng thủ công cho khách, sau đó bấm "Hoàn tất thủ công" và điền mã giao dịch.</div>
          <div>• <strong>🚫 Từ chối:</strong> Chỉ khi có lý do hợp lệ. Phải nhập lý do cụ thể.</div>
          <div style={{ color: "#b91c1c" }}>• <strong>⚠️ Không có VNPay:</strong> Hệ thống chỉ hỗ trợ MoMo và VietQR/PayOS.</div>
        </div>
      </div>
    </div>
  );
}
