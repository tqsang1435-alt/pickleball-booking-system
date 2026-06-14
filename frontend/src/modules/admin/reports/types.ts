export type ReportType =
  | "revenue"
  | "bookings"
  | "coach_income";

export type ExportFormat =
  | "csv"
  | "xlsx";

export type ReportStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "CheckedIn"
  | "Cancelled"
  | "Refunded";

export interface ReportFilterValue {
  reportType: ReportType;
  format: ExportFormat;
  startDate: string;
  endDate: string;
  status?: ReportStatus;
}

export interface ReportHistoryItem {
  id: number;
  exportedBy: number;
  exporterName: string | null;
  reportType: ReportType;
  format: ExportFormat;

  filters: {
    startDate?: string;
    endDate?: string;
    status?: ReportStatus | null;
  };

  filename: string | null;
  rowCount: number;

  status:
    | "SUCCESS"
    | "FAILED";

  errorMessage: string | null;
  createdAt: string;
}