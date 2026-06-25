"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type {
  ExportReportPayload,
  ExportFormat,
  ReportStatus,
  ReportType,
} from "@/types/report.types";

import styles from "./ReportFilter.module.css";

interface ReportFilterProps {
  loading: boolean;

  onExport: (
    payload: ExportReportPayload
  ) => Promise<void>;
}

const REPORT_OPTIONS: Array<{
  value: ReportType;
  label: string;
}> = [
  {
    value: "revenue",
    label: "Báo cáo doanh thu",
  },
  {
    value: "bookings",
    label: "Báo cáo đặt sân",
  },
  {
    value: "coach_income",
    label: "Thu nhập huấn luyện viên",
  },
];

const STATUS_OPTIONS: Array<{
  value: ReportStatus;
  label: string;
}> = [
  {
    value: "Pending",
    label: "Chờ xử lý",
  },
  {
    value: "Confirmed",
    label: "Đã xác nhận",
  },
  {
    value: "Completed",
    label: "Hoàn thành",
  },
  {
    value: "CheckedIn",
    label: "Đã check-in",
  },
  {
    value: "Cancelled",
    label: "Đã hủy",
  },
  {
    value: "Refunded",
    label: "Đã hoàn tiền",
  },
];

function formatInputDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ReportFilter({
  loading,
  onExport,
}: ReportFilterProps) {
  const defaultDates = useMemo(() => {
    const today = new Date();

    const firstDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    return {
      startDate: formatInputDate(firstDay),
      endDate: formatInputDate(today),
    };
  }, []);

  const [reportType, setReportType] =
    useState<ReportType>("revenue");

  const [format, setFormat] =
    useState<ExportFormat>("xlsx");

  const [startDate, setStartDate] =
    useState(defaultDates.startDate);

  const [endDate, setEndDate] =
    useState(defaultDates.endDate);

  const [status, setStatus] =
    useState<ReportStatus | "">("");

  const [validationMessage, setValidationMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setValidationMessage("");

    if (!startDate || !endDate) {
      setValidationMessage(
        "Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc."
      );

      return;
    }

    if (
      new Date(startDate) >
      new Date(endDate)
    ) {
      setValidationMessage(
        "Ngày bắt đầu không được lớn hơn ngày kết thúc."
      );

      return;
    }

    await onExport({
      reportType,
      format,
      startDate,
      endDate,
      status: status || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label}>Loại báo cáo</label>
          <select
            value={reportType}
            disabled={loading}
            onChange={(event) => {
              setReportType(event.target.value as ReportType);
              setStatus("");
            }}
            className={styles.select}
          >
            {REPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Từ ngày</label>
          <input
            type="date"
            required
            max={endDate}
            value={startDate}
            disabled={loading}
            lang="vi"
            onChange={(event) => setStartDate(event.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Đến ngày</label>
          <input
            type="date"
            required
            min={startDate}
            max={formatInputDate(new Date())}
            value={endDate}
            disabled={loading}
            lang="vi"
            onChange={(event) => setEndDate(event.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Trạng thái</label>
          <select
            value={status}
            disabled={loading}
            onChange={(event) =>
              setStatus(event.target.value as ReportStatus | "")
            }
            className={styles.select}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Định dạng</label>
          <select
            value={format}
            disabled={loading}
            onChange={(event) =>
              setFormat(event.target.value as ExportFormat)
            }
            className={styles.select}
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
          </select>
        </div>
      </div>

      {validationMessage && (
        <div className={styles.error}>{validationMessage}</div>
      )}

      <div className={styles.footer}>
        <p className={styles.footerText}>
          File được tạo sẽ tự động tải xuống thiết bị.
        </p>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Đang tạo báo cáo..." : "Xuất báo cáo"}
        </button>
      </div>
    </form>
  );
}