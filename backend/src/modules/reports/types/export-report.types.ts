import type {
  ExportFormat,
  ReportType,
} from "../dto/export-report.dto";

export type ReportCell =
  | string
  | number
  | boolean
  | Date
  | null;

export type ReportRow = Record<string, ReportCell>;

export interface GeneratedReportFile {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  rowCount: number;
}

export interface CreateReportLogInput {
  exportedBy: number;
  reportType: ReportType;
  format: ExportFormat;
  filters: Record<string, unknown>;
  fileName?: string;
  rowCount?: number;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
}

export interface ReportExportHistory {
  id: number;
  exportedBy: number;
  exporterName: string | null;
  reportType: ReportType;
  format: ExportFormat;

  filters: {
    startDate?: string;
    endDate?: string;
    status?: string | null;
  };

  fileName: string | null;
  rowCount: number;
  status: "SUCCESS" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
}