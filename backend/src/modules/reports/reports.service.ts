import ExcelJS from "exceljs";
import type {
  ExportReportDto,
  ExportReportResult,
  ReportExportHistory,
  ReportType,
} from "./dto/export-report.dto";
import {
  createReportExportLogInDB,
  getReportExportHistoryFromDB,
  getReportExportRowsFromDB,
  type ReportDatabaseRow,
} from "./reports.repository";
import * as reportRepo from "./reports.repository";

export async function getDashboardStats() {
  const stats = await reportRepo.getDashboardStatsFromDB();

  return stats;
}

export async function getSaaSDashboardStats(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const prevStart = new Date(start);
  prevStart.setDate(start.getDate() - diffDays);
  const prevEnd = new Date(start);
  prevEnd.setDate(start.getDate() - 1);

  const prevStartDate = prevStart.toISOString().substring(0, 10);
  const prevEndDate = prevEnd.toISOString().substring(0, 10);

  const stats = await reportRepo.getSaaSDashboardStatsFromDB(
    startDate,
    endDate,
    prevStartDate,
    prevEndDate
  );

  return stats;
}

interface ReportColumn {
  key: string;
  label: string;
  width: number;
}

const REPORT_FILENAMES: Record<
  ReportType,
  string
> = {
  revenue:
    "bao-cao-doanh-thu",

  bookings:
    "bao-cao-dat-san",

  coach_income:
    "bao-cao-thu-nhap-hlv",
};

const REPORT_COLUMNS: Record<
  ReportType,
  ReportColumn[]
> = {
  revenue: [
    {
      key: "ReportDate",
      label: "Ngày",
      width: 15,
    },
    {
      key: "BookingCount",
      label: "Số lượt đặt",
      width: 18,
    },
    {
      key: "TotalRevenue",
      label: "Tổng doanh thu",
      width: 22,
    },
  ],

  bookings: [
    {
      key: "BookingCode",
      label: "Mã đặt sân",
      width: 18,
    },
    {
      key: "BookingDate",
      label: "Ngày đặt",
      width: 15,
    },
    {
      key: "PlayerName",
      label: "Người chơi",
      width: 25,
    },
    {
      key: "PlayerEmail",
      label: "Email",
      width: 30,
    },
    {
      key: "PlayerPhone",
      label: "Số điện thoại",
      width: 18,
    },
    {
      key: "BookingType",
      label: "Loại dịch vụ",
      width: 18,
    },
    {
      key: "CourtName",
      label: "Sân",
      width: 22,
    },
    {
      key: "CoachName",
      label: "Huấn luyện viên",
      width: 25,
    },
    {
      key: "StartTime",
      label: "Bắt đầu",
      width: 14,
    },
    {
      key: "EndTime",
      label: "Kết thúc",
      width: 14,
    },
    {
      key: "Status",
      label: "Trạng thái",
      width: 18,
    },
    {
      key: "TotalAmount",
      label: "Tổng tiền",
      width: 20,
    },
    {
      key: "CreatedAt",
      label: "Thời gian tạo",
      width: 22,
    },
  ],

  coach_income: [
    {
      key: "CoachID",
      label: "Mã HLV",
      width: 15,
    },
    {
      key: "CoachName",
      label: "Huấn luyện viên",
      width: 25,
    },
    {
      key: "CoachEmail",
      label: "Email",
      width: 30,
    },
    {
      key: "SessionCount",
      label: "Số buổi",
      width: 15,
    },
    {
      key: "TotalIncome",
      label: "Tổng thu nhập",
      width: 20,
    },
  ],
};

export async function exportReport(
  input: ExportReportDto,
  exportedBy: number
): Promise<ExportReportResult> {
  const filters = {
    startDate:
      input.startDate,

    endDate:
      input.endDate,

    status:
      input.status ?? null,
  };

  try {
    const rows =
      await getReportExportRowsFromDB(
        input
      );

    const filename =
      createReportFilename(
        input
      );

    const result =
      input.format === "csv"
        ? generateCsvReport(
            input,
            rows,
            filename
          )
        : await generateExcelReport(
            input,
            rows,
            filename
          );

    await createReportExportLogInDB({
      exportedBy,

      reportType:
        input.reportType,

      format:
        input.format,

      filters,

      filename:
        result.filename,

      rowCount:
        result.rowCount,

      status:
        "SUCCESS",
    });

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Xuất báo cáo thất bại";

    try {
      await createReportExportLogInDB({
        exportedBy,

        reportType:
          input.reportType,

        format:
          input.format,

        filters,

        rowCount: 0,

        status:
          "FAILED",

        errorMessage,
      });
    } catch (logError) {
      console.error(
        "Không thể lưu lịch sử xuất báo cáo:",
        logError
      );
    }

    throw error;
  }
}

export async function getReportExportHistory(
  limit = 50
): Promise<
  ReportExportHistory[]
> {
  return getReportExportHistoryFromDB(
    limit
  );
}

function createReportFilename(
  input: ExportReportDto
): string {
  const prefix =
    REPORT_FILENAMES[
      input.reportType
    ];

  return (
    `${prefix}_` +
    `${input.startDate}_` +
    `${input.endDate}.` +
    `${input.format}`
  );
}

function generateCsvReport(
  input: ExportReportDto,
  rows: ReportDatabaseRow[],
  filename: string
): ExportReportResult {
  const columns =
    REPORT_COLUMNS[
      input.reportType
    ];

  const header = columns
    .map((column) =>
      escapeCsvCell(
        column.label
      )
    )
    .join(",");

  const body = rows.map(
    (row) =>
      columns
        .map((column) =>
          escapeCsvCell(
            row[column.key]
          )
        )
        .join(",")
  );

  // BOM giúp Excel đọc tiếng Việt.
  const content =
    `\uFEFF${[
      header,
      ...body,
    ].join("\r\n")}`;

  return {
    filename,

    contentType:
      "text/csv; charset=utf-8",

    data:
      Buffer.from(
        content,
        "utf8"
      ),

    rowCount:
      rows.length,
  };
}

async function generateExcelReport(
  input: ExportReportDto,
  rows: ReportDatabaseRow[],
  filename: string
): Promise<ExportReportResult> {
  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Pickleball Booking System";

  workbook.created =
    new Date();

  const worksheet =
    workbook.addWorksheet(
      "Báo cáo",
      {
        views: [
          {
            state:
              "frozen",

            ySplit: 1,
          },
        ],
      }
    );

  const columns =
    REPORT_COLUMNS[
      input.reportType
    ];

  worksheet.columns =
    columns.map(
      (column) => ({
        key:
          column.key,

        header:
          column.label,

        width:
          column.width,
      })
    );

  for (const row of rows) {
    const excelRow: Record<
      string,
      string | number | Date
    > = {};

    for (
      const column of columns
    ) {
      const value =
        row[column.key];

      excelRow[column.key] =
        value ?? "";
    }

    worksheet.addRow(
      excelRow
    );
  }

  const headerRow =
    worksheet.getRow(1);

  headerRow.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
  };

  headerRow.fill = {
    type: "pattern",

    pattern: "solid",

    fgColor: {
      argb: "FF2563EB",
    },
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  headerRow.height = 24;

  if (columns.length > 0) {
    worksheet.autoFilter = {
      from: "A1",

      to: `${
        worksheet.getColumn(
          columns.length
        ).letter
      }1`,
    };
  }

  worksheet.eachRow(
    {
      includeEmpty: false,
    },
    (row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber > 1) {
        row.alignment = {
          vertical: "middle",
        };
      }
    }
  );

  const infoSheet =
    workbook.addWorksheet(
      "Thông tin"
    );

  infoSheet.addRows([
    [
      "Loại báo cáo",
      getReportName(
        input.reportType
      ),
    ],
    [
      "Từ ngày",
      input.startDate,
    ],
    [
      "Đến ngày",
      input.endDate,
    ],
    [
      "Trạng thái",
      input.status ??
        "Tất cả",
    ],
    [
      "Số bản ghi",
      rows.length,
    ],
    [
      "Thời gian xuất",
      new Date(),
    ],
  ]);

  infoSheet.getColumn(
    1
  ).width = 25;

  infoSheet.getColumn(
    2
  ).width = 35;

  infoSheet.getColumn(
    1
  ).font = {
    bold: true,
  };

  const buffer =
    await workbook.xlsx.writeBuffer();

  return {
    filename,

    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    data:
      Buffer.from(buffer),

    rowCount:
      rows.length,
  };
}

function getReportName(
  reportType: ReportType
): string {
  switch (reportType) {
    case "revenue":
      return "Báo cáo doanh thu";

    case "bookings":
      return "Báo cáo đặt sân";

    case "coach_income":
      return "Thu nhập huấn luyện viên";

    default:
      return "Báo cáo";
  }
}

function escapeCsvCell(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '""';
  }

  let text =
    value instanceof Date
      ? value.toISOString()
      : String(value);

  // Ngăn công thức độc hại trong CSV.
  if (
    typeof value === "string" &&
    /^[=+\-@]/.test(text)
  ) {
    text = `'${text}`;
  }

  return `"${text.replaceAll(
    '"',
    '""'
  )}"`;
}