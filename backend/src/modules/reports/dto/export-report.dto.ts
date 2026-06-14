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

export interface ExportReportDto {
  reportType: ReportType;
  format: ExportFormat;
  startDate: string;
  endDate: string;
  status?: ReportStatus;
}

export interface ExportReportResult {
  filename: string;
  contentType: string;
  data: Buffer;
  rowCount: number;
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

  filename: string | null;
  rowCount: number;
  status: "SUCCESS" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
}

export type ExportReportValidationResult =
  | {
      success: true;
      data: ExportReportDto;
    }
  | {
      success: false;
      message: string;
    };

function isValidDateString(
  value: unknown
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  return !Number.isNaN(
    date.getTime()
  );
}

export function validateExportReportDto(
  body: unknown
): ExportReportValidationResult {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      success: false,
      message:
        "Dữ liệu xuất báo cáo không hợp lệ",
    };
  }

  const input = body as Record<
    string,
    unknown
  >;

  if (
    typeof input.reportType !==
      "string" ||
    !REPORT_TYPES.includes(
      input.reportType as ReportType
    )
  ) {
    return {
      success: false,
      message:
        "Loại báo cáo không hợp lệ",
    };
  }

  if (
    typeof input.format !==
      "string" ||
    !EXPORT_FORMATS.includes(
      input.format as ExportFormat
    )
  ) {
    return {
      success: false,
      message:
        "Định dạng phải là csv hoặc xlsx",
    };
  }

  if (
    !isValidDateString(
      input.startDate
    )
  ) {
    return {
      success: false,
      message:
        "Ngày bắt đầu phải có dạng YYYY-MM-DD",
    };
  }

  if (
    !isValidDateString(
      input.endDate
    )
  ) {
    return {
      success: false,
      message:
        "Ngày kết thúc phải có dạng YYYY-MM-DD",
    };
  }

  const startDate = new Date(
    `${input.startDate}T00:00:00`
  );

  const endDate = new Date(
    `${input.endDate}T00:00:00`
  );

  if (startDate > endDate) {
    return {
      success: false,
      message:
        "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
    };
  }

  const totalDays =
    Math.floor(
      (endDate.getTime() -
        startDate.getTime()) /
        86_400_000
    ) + 1;

  if (totalDays > 366) {
    return {
      success: false,
      message:
        "Khoảng thời gian xuất báo cáo tối đa là 366 ngày",
    };
  }

  let status:
    | ReportStatus
    | undefined;

  if (
    input.status !== undefined &&
    input.status !== null &&
    input.status !== ""
  ) {
    if (
      typeof input.status !==
        "string" ||
      !REPORT_STATUSES.includes(
        input.status as ReportStatus
      )
    ) {
      return {
        success: false,
        message:
          "Trạng thái báo cáo không hợp lệ",
      };
    }

    status =
      input.status as ReportStatus;
  }

  return {
    success: true,

    data: {
      reportType:
        input.reportType as ReportType,

      format:
        input.format as ExportFormat,

      startDate:
        input.startDate,

      endDate:
        input.endDate,

      status,
    },
  };
}