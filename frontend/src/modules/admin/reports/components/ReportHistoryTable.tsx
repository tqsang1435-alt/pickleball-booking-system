"use client";

import type { ReportHistoryItem, ReportType } from "@/types/report.types";
import styles from "./ReportHistoryTable.module.css";

interface ReportHistoryTableProps {
  history: ReportHistoryItem[];
  loading: boolean;
}

const REPORT_LABELS: Record<ReportType, { label: string; badgeClass: string; icon: string }> = {
  revenue:      { label: "Doanh thu",    badgeClass: styles.badgeRevenue,  icon: "💰" },
  bookings:     { label: "Đặt sân",      badgeClass: styles.badgeBookings, icon: "🏸" },
  coach_income: { label: "Thu nhập HLV", badgeClass: styles.badgeCoach,    icon: "👨‍🏫" },
};

export default function ReportHistoryTable({ history, loading }: ReportHistoryTableProps) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Đang tải lịch sử...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>Chưa có lịch sử xuất báo cáo</h3>
        <p className={styles.emptyText}>
          Sau khi xuất báo cáo lần đầu, lịch sử sẽ được hiển thị tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Thời gian</th>
            <th className={styles.th}>Người xuất</th>
            <th className={styles.th}>Loại báo cáo</th>
            <th className={styles.th}>Định dạng</th>
            <th className={styles.th}>Bộ lọc thời gian</th>
            <th className={`${styles.th} ${styles.thCenter}`}>Số dòng</th>
            <th className={styles.th}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => {
            const reportMeta = REPORT_LABELS[item.reportType];
            const { datePart, timePart } = splitDateTime(item.createdAt);
            const initials = getInitials(item.exporterName ?? `#${item.exportedBy}`);

            return (
              <tr key={item.id} className={styles.tr}>
                {/* Thời gian */}
                <td className={styles.td}>
                  <div className={styles.timeCell}>
                    <span className={styles.timeDate}>{datePart}</span>
                    <span className={styles.timeClock}>🕐 {timePart}</span>
                  </div>
                </td>

                {/* Người xuất */}
                <td className={styles.td}>
                  <div className={styles.exporterCell}>
                    <div className={styles.avatar}>{initials}</div>
                    <span className={styles.exporterName}>
                      {item.exporterName ?? `Người dùng #${item.exportedBy}`}
                    </span>
                  </div>
                </td>

                {/* Loại báo cáo */}
                <td className={styles.td}>
                  <span className={`${styles.badge} ${reportMeta.badgeClass}`}>
                    <span>{reportMeta.icon}</span>
                    {reportMeta.label}
                  </span>
                </td>

                {/* Định dạng */}
                <td className={styles.td}>
                  <span className={`${styles.badge} ${item.format === "xlsx" ? styles.badgeXlsx : styles.badgeCsv}`}>
                    {item.format === "xlsx" ? "📊" : "📄"} {item.format.toUpperCase()}
                  </span>
                </td>

                {/* Bộ lọc */}
                <td className={styles.td}>
                  <div className={styles.filterCell}>
                    <div className={styles.filterDate}>
                      <span>{formatDate(item.filters.startDate)}</span>
                      <span className={styles.filterArrow}>→</span>
                      <span>{formatDate(item.filters.endDate)}</span>
                    </div>
                    <span className={styles.filterStatus}>
                      {item.filters.status
                        ? `Trạng thái: ${item.filters.status}`
                        : "Tất cả trạng thái"}
                    </span>
                  </div>
                </td>

                {/* Số dòng */}
                <td className={`${styles.td} ${styles.tdCenter}`}>
                  <span className={styles.rowCount}>
                    {item.rowCount.toLocaleString("vi-VN")}
                  </span>
                </td>

                {/* Trạng thái */}
                <td className={styles.td}>
                  {item.status === "SUCCESS" ? (
                    <span className={styles.statusSuccess}>
                      <span className={`${styles.dot} ${styles.dotSuccess}`} />
                      Thành công
                    </span>
                  ) : (
                    <div className={styles.statusFailed}>
                      <span className={styles.statusFailedBadge}>
                        <span className={`${styles.dot} ${styles.dotFailed}`} />
                        Thất bại
                      </span>
                      {item.errorMessage && (
                        <span className={styles.errorMsg}>{item.errorMessage}</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function splitDateTime(value: string): { datePart: string; timePart: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { datePart: value || "—", timePart: "" };

  const datePart = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return { datePart, timePart };
}

/**
 * Chuyển "YYYY-MM-DD" → "DD/MM/YYYY" để hiển thị đúng format Việt Nam
 */
function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  // Nếu đã là YYYY-MM-DD thì parse trực tiếp không qua Date() để tránh timezone shift
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  // Fallback
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
