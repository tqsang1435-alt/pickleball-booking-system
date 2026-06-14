export const REPORT_TYPES = [
  "revenue",
  "bookings",
  "coach_income",
] as const;

export const EXPORT_FORMATS = [
  "csv",
  "xlsx",
] as const;

export const REPORT_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "CheckedIn",
  "Cancelled",
  "Refunded",
] as const;

export type ReportType =
  (typeof REPORT_TYPES)[number];

export type ExportFormat =
  (typeof EXPORT_FORMATS)[number];

export type ReportStatus =
  (typeof REPORT_STATUSES)[number];

/**
 * Dữ liệu gửi lên API xuất báo cáo.
 */
export interface ExportReportPayload {
  reportType: ReportType;
  format: ExportFormat;
  startDate: string;
  endDate: string;
  status?: ReportStatus;
}

/**
 * Kết quả frontend nhận được sau khi gọi API xuất file.
 */
export interface ExportReportResult {
  blob: Blob;
  filename: string;
}

/**
 * Bộ lọc đã được lưu trong lịch sử xuất báo cáo.
 */
export interface ReportExportFilters {
  startDate?: string;
  endDate?: string;
  status?: ReportStatus | null;
}

/**
 * Một bản ghi trong lịch sử xuất báo cáo.
 */
export interface ReportHistoryItem {
  id: number;
  exportedBy: number;
  exporterName: string | null;
  reportType: ReportType;
  format: ExportFormat;
  filters: ReportExportFilters;
  filename: string | null;
  rowCount: number;
  status: "SUCCESS" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
}

/**
 * Cấu trúc response API chung của backend.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}