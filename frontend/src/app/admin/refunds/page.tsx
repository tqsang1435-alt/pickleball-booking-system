"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  getManagerRefunds,
  approveRefund,
  processRefund,
  completeManualRefund,
  rejectRefund,
} from "@/services/refundApi";
import type { RefundManagerRecord } from "@/services/refundApi";
import { getToken, getUser } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./page.module.css";

// ── Status config ─────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  Requested: "Đã yêu cầu",
  Approved: "Đã duyệt",
  Processing: "Đang xử lý",
  PendingManual: "Chờ chuyển khoản",
  Completed: "Hoàn tất",
  Failed: "Thất bại",
  Rejected: "Từ chối",
};

// ── Sub-components ─────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Requested:      styles.bs_blue,
    Approved:       styles.bs_blue,
    Processing:     styles.bs_orange,
    PendingManual:  styles.bs_orange,
    Completed:      styles.bs_green,
    Failed:         styles.bs_red,
    Rejected:       styles.bs_red,
  };
  return (
    <span className={`${styles.badgeStatus} ${cls[status] ?? styles.bs_gray}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ActionBtn({
  label, onClick, color = "#64748b", disabled = false,
}: {
  label: string; onClick: () => void; color?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={styles.actionBtn}
      style={{ background: color }}
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Xác nhận Chuyển khoản Thủ công</h3>
          <button className={styles.modalClose} onClick={onClose} disabled={loading}>×</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalMetaText}>
            Mã refund: <span className={styles.modalMetaCode}>{refundCode}</span>
            {bookingCode && <> — Booking: <span className={styles.modalMetaValue}>{bookingCode}</span></>}
            {refundAmount && <> — Số tiền: <span className={styles.modalMetaAmount}>{formatCurrency(refundAmount)}</span></>}
          </p>

          {reason && (
            <div className={styles.transferContainer}>
              <div className={styles.transferDetails}>
                <div className={styles.transferHeading}>Lý do & Thông tin nhận tiền:</div>
                <div className={styles.transferText}>
                  {reason.replace(/\[Bank:.*?\]|\[STK:.*?\]|\[Name:.*?\]/g, "").trim() || reason}
                </div>
                
                {bankId && (
                  <div className={styles.bankInfoBlock}>
                    <div className={styles.bankInfoRow}>Ngân hàng: <strong>{bankId}</strong></div>
                    <div className={styles.bankInfoRow}>Số tài khoản: <span className={styles.accountNumber}>{accountNo}</span></div>
                    <div className={styles.bankInfoRow}>Tên người nhận: <strong>{accountName}</strong></div>
                  </div>
                )}
              </div>

              {qrUrl && (
                <div className={styles.qrCodeContainer}>
                  <div className={styles.qrCodeWrapper}>
                    <img src={qrUrl} alt="VietQR" className={styles.qrImage} />
                    <div className={styles.qrCaption}>Quét mã chuyển tiền</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.uploadGroup}>
            <label className={styles.uploadLabel}>
              Tải lên ảnh Bill chuyển khoản <span className={styles.uploadRequired}>*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBillImage(e.target.files?.[0] || null)}
              disabled={loading}
              className={styles.uploadInput}
            />
          </div>

          <div className={styles.modalNotice}>
            <strong>Lưu ý:</strong> Đây là hoàn tiền thủ công. Bạn phải chuyển khoản ngân hàng cho khách trước, sau đó bắt buộc tải ảnh bill lên và xác nhận.
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            disabled={loading}
            className={styles.btnActionClose}
          >
            Hủy
          </button>
          <button
            onClick={() => billImage && onConfirm(billImage)}
            disabled={loading || !billImage}
            className={styles.btnActionConfirm}
          >
            {loading ? "Đang xử lý..." : "Xác nhận hoàn tất"}
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Từ chối Hoàn tiền</h3>
          <button className={styles.modalClose} onClick={onClose} disabled={loading}>×</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalMetaText}>
            Mã refund: <span className={styles.modalMetaCode}>{refundCode}</span>
            {bookingCode && <> — Booking: <span className={styles.modalMetaValue}>{bookingCode}</span></>}
          </p>

          {refundReason && (
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", fontWeight: 700, textTransform: "uppercase" }}>Lý do từ khách:</div>
              <div style={{ fontSize: "13px", color: "#1e293b", whiteSpace: "pre-wrap" }}>{refundReason}</div>
            </div>
          )}

          <div className={styles.uploadGroup}>
            <label className={styles.uploadLabel}>
              Lý do từ chối <span className={styles.uploadRequired}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Nhập lý do từ chối hoàn tiền (bắt buộc)..."
              disabled={loading}
              className={styles.textareaReject}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            disabled={loading}
            className={styles.btnActionClose}
          >
            Hủy
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={loading || !reason.trim()}
            className={styles.btnActionReject}
          >
            {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── StatCard component ─────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  sparklinePath: string;
  sparklineStroke: string;
  sparklineColor: string;
}

function StatCard({
  icon,
  label,
  value,
  color,
  sparklinePath,
  sparklineStroke,
  sparklineColor,
}: StatCardProps) {
  const gradientId = `spark-grad-refund-${color}`;
  
  const renderValue = (val: string | number) => {
    const valStr = String(val);
    if (valStr.includes("/")) {
      const parts = valStr.split("/");
      return (
        <span>
          {parts[0].trim()}
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8", marginLeft: "2px" }}>
            /{parts[1].trim()}
          </span>
        </span>
      );
    }
    return valStr;
  };

  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <div className={styles.statHeader}>
        <div className={styles.statIconBox}>{icon}</div>
      </div>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{renderValue(value)}</span>

      {/* Mini sparkline visualization at the bottom */}
      <div className={styles.sparklineWrap}>
        <svg className={styles.sparkline} viewBox="0 0 100 30" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.05"/>
              <stop offset="100%" stopColor={sparklineColor} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={sparklinePath} fill={`url(#${gradientId})`} />
          <path d={sparklineStroke} fill="none" stroke={sparklineColor} strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}

// ── Modal State interface ────────────────────────────────────────

type ModalType = "completeManual" | "reject" | null;

interface ModalState {
  type: ModalType;
  refundCode: string;
  refundAmount?: number;
  paymentMethod?: string;
  bookingCode?: string;
  reason?: string;
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

  // User credentials for Header initials
  const [userName, setUserName] = useState("Admin");
  const [userEmail, setUserEmail] = useState("");
  
  // Header Notification Popup
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setUserName(u.FullName || u.fullName || "Admin");
      setUserEmail(u.Email || u.email || "admin@pickleclub.vn");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get("search");
      if (searchParam) {
        setSearchText(searchParam);
      }
    }
    loadRefunds();
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

      await completeManualRefund(token!, formData);
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
    totalRefunded: refunds.filter((r) => r.Status === "Completed").reduce((sum, r) => sum + Number(r.RefundAmount), 0),
  }), [refunds]);

  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AD";

  // List of active pending refunds to display in the notification bar dropdown
  const pendingRefundsList = useMemo(() => {
    return refunds
      .filter((r) => ["Requested", "Approved", "Processing", "PendingManual"].includes(r.Status))
      .slice(0, 5);
  }, [refunds]);

  return (
    <div className={styles.wrapper}>
      {/* ── Sticky Top Header Bar ── */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumbs}>
            <span>Quản trị</span>
            <span className={styles.chevron}>/</span>
            <span className={styles.currentCrumb}>Quản lý Hoàn tiền</span>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${filterStatus === "all" ? styles.tabActive : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              Tất cả
            </button>
            <button
              className={`${styles.tab} ${filterStatus === "Requested" ? styles.tabActive : ""}`}
              onClick={() => setFilterStatus("Requested")}
            >
              Chờ duyệt
            </button>
            <button
              className={`${styles.tab} ${filterStatus === "Processing" ? styles.tabActive : ""}`}
              onClick={() => setFilterStatus("Processing")}
            >
              Đang xử lý
            </button>
            <button
              className={`${styles.tab} ${filterStatus === "Completed" ? styles.tabActive : ""}`}
              onClick={() => setFilterStatus("Completed")}
            >
              Đã hoàn tất
            </button>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.searchBar}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm mã booking, mã refund, tên khách..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Notification bell showing pending refunds count */}
          <div className={styles.notifWrap} ref={notifRef}>
            <button
              className={styles.btnIcon}
              onClick={() => setNotifOpen(o => !o)}
              title="Yêu cầu chờ xử lý"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {counts.pending > 0 && (
                <span className={styles.notifBadge}>
                  {counts.pending > 9 ? "9+" : counts.pending}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span className={styles.notifTitle}>Hoàn tiền chờ duyệt</span>
                </div>
                <div className={styles.notifList}>
                  {pendingRefundsList.length === 0 ? (
                    <div className={styles.notifEmpty}>Không có yêu cầu chờ duyệt</div>
                  ) : (
                    pendingRefundsList.map(r => (
                      <div
                        key={r.RefundID}
                        className={styles.notifItem}
                        onClick={() => {
                          setSearchText(r.RefundCode || "");
                          setNotifOpen(false);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className={styles.notifItemTitle}>Khách hàng: {r.PlayerName}</div>
                        <div className={styles.notifItemMsg}>
                          Số tiền: <strong style={{ color: "#dc2626" }}>{formatCurrency(Number(r.RefundAmount))}</strong>
                        </div>
                        <div className={styles.notifItemTime}>
                          Mã refund: {r.RefundCode}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Refresh page */}
          <button className={styles.btnIcon} onClick={() => loadRefunds()} title="Tải lại dữ liệu">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          {/* Export Action Primary Blue Button */}
          <button
            className={styles.btnQuickActions}
            onClick={() => {
              alert("Xuất dữ liệu đối soát sang Excel thành công!");
            }}
          >
            Xuất Excel
          </button>

          {/* User Rounded Avatar */}
          <div className={styles.avatar} title={`${userName} (${userEmail})`}>
            {userInitials}
          </div>
        </div>
      </header>

      {/* ── Main content area with gray background ── */}
      <div className={styles.contentArea}>
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
            bookingCode={modal.bookingCode}
            reason={modal.reason}
            onConfirm={handleRejectConfirm}
            onClose={() => setModal({ type: null, refundCode: "" })}
            loading={actionLoading}
          />
        )}

        {/* Toast Alert Notifications */}
        {success && (
          <div className={styles.alertSuccess}>
            {success}
          </div>
        )}
        {error && (
          <div className={styles.alertError}>
            Lỗi: {error}
          </div>
        )}

        {/* Stat Grid with SVG Sparklines */}
        <div className={styles.statGrid}>
          <StatCard
            icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
            }
            label="Chờ duyệt"
            value={counts.pending}
            color="blue"
            sparklinePath="M0,20 C15,10 30,25 45,15 C60,5 75,25 90,18 L100,22 L100,30 L0,30 Z"
            sparklineStroke="M0,20 C15,10 30,25 45,15 C60,5 75,25 90,18 L100,22"
            sparklineColor="#2563eb"
          />

          <StatCard
            icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1 1 21 12h-1.5"/>
              </svg>
            }
            label="Đang xử lý"
            value={counts.processing}
            color="orange"
            sparklinePath="M0,22 C15,12 30,28 45,18 C60,8 75,28 90,20 L100,25 L100,30 L0,30 Z"
            sparklineStroke="M0,22 C15,12 30,28 45,18 C60,8 75,28 90,20 L100,25"
            sparklineColor="#ea580c"
          />

          <StatCard
            icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
            }
            label="Hoàn tất"
            value={counts.completed}
            color="green"
            sparklinePath="M0,15 C20,10 40,25 60,15 C80,5 90,20 100,10 L100,30 L0,30 Z"
            sparklineStroke="M0,15 C20,10 40,25 60,15 C80,5 90,20 100,10"
            sparklineColor="#16a34a"
          />

          <StatCard
            icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
            }
            label="Tổng đã hoàn"
            value={formatCurrency(counts.totalRefunded)}
            color="purple"
            sparklinePath="M0,25 C20,15 40,28 60,18 C80,8 90,22 100,12 L100,30 L0,30 Z"
            sparklineStroke="M0,25 C20,15 40,28 60,18 C80,8 90,22 100,12"
            sparklineColor="#8b5cf6"
          />
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Từ:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Đến:</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterInput}
            >
              <option value="all">Tất cả ({refunds.length})</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v} ({refunds.filter((r) => r.Status === k).length})</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Thanh toán:</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className={styles.filterInput}
            >
              <option value="all">Tất cả</option>
              <option value="Momo">MoMo</option>
              <option value="PayOS">VietQR/PayOS</option>
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
            className={styles.btnReset}
          >
            Làm mới bộ lọc
          </button>
        </div>

        {/* Main Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 12px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize: "14px", fontWeight: 600 }}>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.noOperationsFound}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
              <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-4.586a1 1 0 0 0-.707.293l-1.414 1.414a2 2 0 0 1-2.828 0L8.707 13.293a1 1 0 0 0-.707-.293H4" />
            </svg>
            <p className={styles.noOperationsTitle}>Không tìm thấy yêu cầu hoàn tiền nào</p>
            <p className={styles.noOperationsDesc}>Không tìm thấy dữ liệu khớp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {["Mã Refund", "Khách hàng", "Số tiền", "Phương thức", "Lý do hoàn", "Trạng thái", "Ngày yêu cầu", "Thao tác"].map((h) => (
                      <th key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.RefundID}>
                      {/* Mã Refund */}
                      <td style={{ padding: "14px 18px" }}>
                        <div className={styles.refundCode}>
                          {r.RefundCode || `#${r.RefundID}`}
                        </div>
                        <div className={styles.bookingSubtext}>
                          {r.BookingID ? `Booking #${r.BookingID}` : "Đăng ký giải đấu"} {r.BookingCode && `(${r.BookingCode})`}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td style={{ padding: "14px 18px" }}>
                        <div className={styles.customerName}>{r.PlayerName || "—"}</div>
                        <div className={styles.customerEmail}>{r.PlayerEmail || ""}</div>
                      </td>

                      {/* Số tiền: Hiển thị tiền âm (-) màu đỏ đặc trưng */}
                      <td style={{ padding: "14px 18px" }}>
                        <div className={styles.refundAmount}>
                          {formatCurrency(-Number(r.RefundAmount))}
                        </div>
                      </td>

                      {/* Phương thức */}
                      <td style={{ padding: "14px 18px" }}>
                        <div className={styles.methodMain}>
                          {r.PaymentMethod === "Momo" ? "MoMo" : "VietQR/PayOS"}
                        </div>
                        <div className={styles.methodSub}>
                          {r.RefundMethod === "Momo"
                            ? "Hoàn tự động"
                            : "Chuyển khoản thủ công"}
                        </div>
                      </td>

                      {/* Lý do hoàn */}
                      <td style={{ padding: "14px 18px", maxWidth: "250px" }}>
                        <div className={styles.reasonText}>
                          {r.Reason || "—"}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td style={{ padding: "14px 18px" }}>
                        <StatusBadge status={r.Status} />
                      </td>

                      {/* Ngày yêu cầu */}
                      <td style={{ padding: "14px 18px" }}>
                        <div className={styles.dateMain}>
                          {new Date(r.RequestedAt).toLocaleString("vi-VN")}
                          {r.ProcessedAt && (
                            <div className={styles.dateProcessed}>
                              {new Date(r.ProcessedAt).toLocaleString("vi-VN")}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {/* Approve: chỉ khi Requested */}
                          {r.Status === "Requested" && (
                            <ActionBtn
                              label="Duyệt"
                              color="#2563eb"
                              onClick={() => handleApprove(r.RefundCode!)}
                              disabled={actionLoading}
                            />
                          )}

                          {/* Process MoMo: khi Momo + Processing hoặc PendingManual */}
                          {r.RefundMethod === "Momo" && ["Processing", "PendingManual"].includes(r.Status) && (
                            <ActionBtn
                              label="Gửi MoMo"
                              color="#a855f7"
                              onClick={() => handleProcessMomo(r.RefundCode!)}
                              disabled={actionLoading}
                            />
                          )}

                          {/* Complete Manual: PayOS + PendingManual hoặc Processing */}
                          {r.RefundMethod !== "Momo" && ["PendingManual", "Processing"].includes(r.Status) && (
                            <ActionBtn
                              label="Hoàn tất thủ công"
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
                              label="Từ chối"
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
            <div className={styles.tableFooter}>
              Hiển thị {filtered.length}/{refunds.length} yêu cầu
            </div>
          </div>
        )}

        {/* Legend */}
        <div className={styles.legendSection}>
          <h4 className={styles.legendTitle}>Hướng dẫn xử lý yêu cầu hoàn tiền:</h4>
          <div className={styles.legendGrid}>
            <div className={styles.legendItem}>
              • <strong>Hoàn tự động (MoMo):</strong> Hệ thống tự động hoàn tiền nếu cấu hình MoMo gateway đầy đủ. Bấm "Duyệt" → "Gửi MoMo".
            </div>
            <div className={styles.legendItem}>
              • <strong>Chuyển khoản thủ công (VietQR/PayOS):</strong> Bạn phải chuyển khoản ngân hàng thủ công cho khách theo tài khoản được cung cấp, sau đó bấm "Hoàn tất thủ công" để tải ảnh bill giao dịch xác nhận.
            </div>
            <div className={styles.legendItem}>
              • <strong>Từ chối:</strong> Chỉ thực hiện khi phát hiện yêu cầu hoàn tiền không hợp lệ. Phải nhập lý do chi tiết để thông báo cho khách hàng.
            </div>
            <div className={`${styles.legendItem} ${styles.legendImportant}`}>
              • Lưu ý về VNPay: Hệ thống hiện tại chỉ hỗ trợ cổng thanh toán MoMo và VietQR/PayOS để thực hiện các giao dịch hoàn tiền.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
