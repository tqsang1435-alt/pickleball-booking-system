
import type {
  ExportReportDto,
  ReportExportHistory,
} from "./dto/export-report.dto";



import { getPool, sql } from "@/database/connection";

export async function getDashboardStatsFromDB() {
  const pool = await getPool();
  const targetDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });

  const queries = `
    -- Today Revenue
    SELECT ISNULL(SUM(TotalAmount), 0) AS TodayRevenue
    FROM Bookings
    WHERE BookingDate = @TargetDate
      AND Status IN ('Confirmed', 'Completed', 'CheckedIn');

    -- Today Bookings Count
    SELECT COUNT(*) AS TodayBookingsCount
    FROM Bookings
    WHERE BookingDate = @TargetDate;

    -- Active Courts
    SELECT COUNT(*) AS ActiveCourts FROM Courts WHERE Status = 'Available';

    -- Total Courts
    SELECT COUNT(*) AS TotalCourts FROM Courts;

    -- Active Coaches
    SELECT COUNT(*) AS ActiveCoaches 
    FROM Coaches c
    JOIN Users u ON c.UserID = u.UserID
    WHERE c.Status = 'Approved' AND u.Status = 'Active';

    -- Active Staff
    SELECT COUNT(DISTINCT u.UserID) AS ActiveStaff 
    FROM Users u
    JOIN UserRoles ur ON u.UserID = ur.UserID
    JOIN Roles r ON ur.RoleID = r.RoleID
    WHERE r.RoleName = 'Staff' AND u.Status = 'Active';

    -- Active Combos
    SELECT COUNT(*) AS ActiveCombos 
    FROM Promotions 
    WHERE Status = 'Active';

    -- Latest Bookings (Top 5)
    SELECT TOP 5
      b.BookingCode,
      u.FullName AS PlayerName,
      u.Email AS PlayerEmail,
      u.PhoneNumber AS PlayerPhone,
      b.BookingType AS ServiceType,
      b.Status,
      b.CreatedAt,
      bd.StartTime,
      bd.EndTime,
      c.CourtName,
      coach.FullName AS CoachName
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN BookingDetails bd ON b.BookingID = bd.BookingID
    LEFT JOIN Courts c ON bd.CourtID = c.CourtID
    LEFT JOIN Coaches co ON bd.CoachID = co.CoachID
    LEFT JOIN Users coach ON co.UserID = coach.UserID
    ORDER BY b.CreatedAt DESC;
  `;

  const result = await pool.request()
    .input("TargetDate", sql.Date, targetDate)
    .query(queries);
    
  const rs = result.recordsets as any[][];

  return {
    todayRevenue: rs[0][0].TodayRevenue,
    todayBookingsCount: rs[1][0].TodayBookingsCount,
    activeCourts: rs[2][0].ActiveCourts,
    totalCourts: rs[3][0].TotalCourts,
    activeCoaches: rs[4][0].ActiveCoaches,
    activeStaff: rs[5][0].ActiveStaff,
    activeCombos: rs[6][0].ActiveCombos,
    latestBookings: rs[7].map((b: any) => ({
      BookingCode: b.BookingCode,
      PlayerName: b.PlayerName,
      PlayerEmail: b.PlayerEmail,
      PlayerPhone: b.PlayerPhone,
      ServiceType: b.ServiceType,
      CourtName: b.CourtName,
      CoachName: b.CoachName,
      StartTime: b.StartTime ? new Date(b.StartTime.getTime() - b.StartTime.getTimezoneOffset() * 60000).toISOString().substring(11, 16) : null,
      EndTime: b.EndTime ? new Date(b.EndTime.getTime() - b.EndTime.getTimezoneOffset() * 60000).toISOString().substring(11, 16) : null,
      Status: b.Status,
      CreatedAt: b.CreatedAt ? b.CreatedAt.toISOString() : null,
    })),
  };
}
export type ReportDatabaseRow =
  Record<
    string,
    string | number | Date | null
  >;

export interface CreateReportExportLogInput {
  exportedBy: number;

  reportType:
    ExportReportDto["reportType"];

  format:
    ExportReportDto["format"];

  filters: {
    startDate: string;
    endDate: string;
    status?: string | null;
  };

  filename?: string;
  rowCount?: number;

  status:
    | "SUCCESS"
    | "FAILED";

  errorMessage?: string;
}

export async function getReportExportRowsFromDB(
  input: ExportReportDto
): Promise<ReportDatabaseRow[]> {
  switch (input.reportType) {
    case "revenue":
      return getRevenueReportRows(
        input
      );

    case "bookings":
      return getBookingReportRows(
        input
      );

    case "coach_income":
      return getCoachIncomeReportRows(
        input
      );

    default:
      return [];
  }
}

async function getRevenueReportRows(
  input: ExportReportDto
): Promise<ReportDatabaseRow[]> {
  const pool = await getPool();

  const request = pool
    .request()
    .input(
      "StartDate",
      sql.Date,
      input.startDate
    )
    .input(
      "EndDate",
      sql.Date,
      input.endDate
    );

  let statusCondition = `
    AND b.Status IN (
      'Confirmed',
      'Completed',
      'CheckedIn'
    )
  `;

  if (input.status) {
    request.input(
      "Status",
      sql.NVarChar(50),
      input.status
    );

    statusCondition = `
      AND b.Status = @Status
    `;
  }

  const result =
    await request.query(`
      SELECT
        CONVERT(
          VARCHAR(10),
          b.BookingDate,
          23
        ) AS ReportDate,

        COUNT(*) AS BookingCount,

        CAST(
          ISNULL(
            SUM(b.TotalAmount),
            0
          )
          AS DECIMAL(18, 2)
        ) AS TotalRevenue

      FROM Bookings b

      WHERE
        b.BookingDate >= @StartDate

        AND b.BookingDate <= @EndDate

        ${statusCondition}

      GROUP BY
        b.BookingDate

      ORDER BY
        b.BookingDate ASC;
    `);

  return result.recordset.map(
    (row: any) => ({
      ReportDate:
        row.ReportDate ?? "",

      BookingCount:
        Number(
          row.BookingCount ?? 0
        ),

      TotalRevenue:
        Number(
          row.TotalRevenue ?? 0
        ),
    })
  );
}

async function getBookingReportRows(
  input: ExportReportDto
): Promise<ReportDatabaseRow[]> {
  const pool = await getPool();

  const request = pool
    .request()
    .input(
      "StartDate",
      sql.Date,
      input.startDate
    )
    .input(
      "EndDate",
      sql.Date,
      input.endDate
    );

  let statusCondition = "";

  if (input.status) {
    request.input(
      "Status",
      sql.NVarChar(50),
      input.status
    );

    statusCondition = `
      AND b.Status = @Status
    `;
  }

  const result =
    await request.query(`
      SELECT
        b.BookingID,

        b.BookingCode,

        CONVERT(
          VARCHAR(10),
          b.BookingDate,
          23
        ) AS BookingDate,

        b.BookingType,

        b.Status,

        CAST(
          ISNULL(
            b.TotalAmount,
            0
          )
          AS DECIMAL(18, 2)
        ) AS TotalAmount,

        CONVERT(
          VARCHAR(19),
          b.CreatedAt,
          120
        ) AS CreatedAt,

        player.FullName
          AS PlayerName,

        player.Email
          AS PlayerEmail,

        player.PhoneNumber
          AS PlayerPhone,

        c.CourtName,

        coach.FullName
          AS CoachName,

        CONVERT(
          VARCHAR(5),
          bd.StartTime,
          108
        ) AS StartTime,

        CONVERT(
          VARCHAR(5),
          bd.EndTime,
          108
        ) AS EndTime

      FROM Bookings b

      LEFT JOIN Users player
        ON b.UserID =
          player.UserID

      LEFT JOIN BookingDetails bd
        ON b.BookingID =
          bd.BookingID

      LEFT JOIN Courts c
        ON bd.CourtID =
          c.CourtID

      LEFT JOIN Coaches co
        ON bd.CoachID =
          co.CoachID

      LEFT JOIN Users coach
        ON co.UserID =
          coach.UserID

      WHERE
        b.BookingDate >= @StartDate

        AND b.BookingDate <= @EndDate

        ${statusCondition}

      ORDER BY
        b.BookingDate DESC,
        bd.StartTime ASC;
    `);

  return result.recordset.map(
    (row: any) => ({
      BookingCode:
        row.BookingCode ?? "",

      BookingDate:
        row.BookingDate ?? "",

      PlayerName:
        row.PlayerName ?? "",

      PlayerEmail:
        row.PlayerEmail ?? "",

      PlayerPhone:
        row.PlayerPhone ?? "",

      BookingType:
        row.BookingType ?? "",

      CourtName:
        row.CourtName ?? "",

      CoachName:
        row.CoachName ?? "",

      StartTime:
        row.StartTime ?? "",

      EndTime:
        row.EndTime ?? "",

      Status:
        row.Status ?? "",

      TotalAmount:
        Number(
          row.TotalAmount ?? 0
        ),

      CreatedAt:
        row.CreatedAt ?? "",
    })
  );
}

async function getCoachIncomeReportRows(
  input: ExportReportDto
): Promise<ReportDatabaseRow[]> {
  const pool = await getPool();

  const request = pool
    .request()
    .input(
      "StartDate",
      sql.Date,
      input.startDate
    )
    .input(
      "EndDate",
      sql.Date,
      input.endDate
    );

  let statusCondition = `
    AND b.Status IN (
      'Confirmed',
      'Completed',
      'CheckedIn'
    )
  `;

  if (input.status) {
    request.input(
      "Status",
      sql.NVarChar(50),
      input.status
    );

    statusCondition = `
      AND b.Status = @Status
    `;
  }

  /*
   * Mỗi booking chỉ được tính một lần
   * cho một huấn luyện viên.
   *
   * TotalIncome hiện lấy TotalAmount
   * của booking có huấn luyện viên.
   *
   * Nếu BookingDetails có cột CoachFee,
   * hãy đổi TotalAmount thành CoachFee.
   */
  const result =
    await request.query(`
      WITH CoachBookings AS (
        SELECT DISTINCT
          bd.CoachID,

          b.BookingID,

          CAST(
            ISNULL(
              b.TotalAmount,
              0
            )
            AS DECIMAL(18, 2)
          ) AS IncomeAmount

        FROM BookingDetails bd

        INNER JOIN Bookings b
          ON bd.BookingID =
            b.BookingID

        WHERE
          bd.CoachID IS NOT NULL

          AND b.BookingDate >=
            @StartDate

          AND b.BookingDate <=
            @EndDate

          ${statusCondition}
      )

      SELECT
        co.CoachID,

        coach.FullName
          AS CoachName,

        coach.Email
          AS CoachEmail,

        COUNT(
          cb.BookingID
        ) AS SessionCount,

        CAST(
          ISNULL(
            SUM(
              cb.IncomeAmount
            ),
            0
          )
          AS DECIMAL(18, 2)
        ) AS TotalIncome

      FROM CoachBookings cb

      INNER JOIN Coaches co
        ON cb.CoachID =
          co.CoachID

      INNER JOIN Users coach
        ON co.UserID =
          coach.UserID

      GROUP BY
        co.CoachID,
        coach.FullName,
        coach.Email

      ORDER BY
        TotalIncome DESC;
    `);

  return result.recordset.map(
    (row: any) => ({
      CoachID:
        Number(
          row.CoachID
        ),

      CoachName:
        row.CoachName ?? "",

      CoachEmail:
        row.CoachEmail ?? "",

      SessionCount:
        Number(
          row.SessionCount ?? 0
        ),

      TotalIncome:
        Number(
          row.TotalIncome ?? 0
        ),
    })
  );
}

export async function createReportExportLogInDB(
  input: CreateReportExportLogInput
): Promise<number> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input(
      "ExportedBy",
      sql.Int,
      input.exportedBy
    )
    .input(
      "ReportType",
      sql.NVarChar(50),
      input.reportType
    )
    .input(
      "Format",
      sql.NVarChar(10),
      input.format
    )
    .input(
      "Filters",
      sql.NVarChar(sql.MAX),
      JSON.stringify(
        input.filters
      )
    )
    .input(
      "FileName",
      sql.NVarChar(255),
      input.filename ?? null
    )
    .input(
      "RowCount",
      sql.Int,
      input.rowCount ?? 0
    )
    .input(
      "Status",
      sql.NVarChar(20),
      input.status
    )
    .input(
      "ErrorMessage",
      sql.NVarChar(sql.MAX),
      input.errorMessage
        ? input.errorMessage.slice(
            0,
            4000
          )
        : null
    )
    .query(`
      INSERT INTO ReportExportLogs (
        ExportedBy,
        ReportType,
        [Format],
        Filters,
        [FileName],
        [RowCount],
        [Status],
        ErrorMessage,
        CreatedAt
      )
      VALUES (
        @ExportedBy,
        @ReportType,
        @Format,
        @Filters,
        @FileName,
        @RowCount,
        @Status,
        @ErrorMessage,
        SYSUTCDATETIME()
      );

      SELECT
        CAST(
          SCOPE_IDENTITY()
          AS INT
        ) AS ReportExportLogID;
    `);

  return Number(
    result.recordset[0]
      .ReportExportLogID
  );
}

export async function getReportExportHistoryFromDB(
  limit = 50
): Promise<
  ReportExportHistory[]
> {
  const pool = await getPool();

  const safeLimit = Math.min(
    Math.max(
      Math.trunc(limit),
      1
    ),
    100
  );

  const result = await pool
    .request()
    .input(
      "Limit",
      sql.Int,
      safeLimit
    )
    .query(`
      SELECT TOP (@Limit)
        log.ReportExportLogID,

        log.ExportedBy,

        log.ReportType,

        log.[Format],

        log.Filters,

        log.[FileName],

        log.[RowCount],

        log.[Status],

        log.ErrorMessage,

        log.CreatedAt,

        u.FullName
          AS ExporterName

      FROM ReportExportLogs log

      LEFT JOIN Users u
        ON log.ExportedBy =
          u.UserID

      ORDER BY
        log.CreatedAt DESC;
    `);

  return result.recordset.map(
    (row: any) => ({
      id:
        Number(
          row.ReportExportLogID
        ),

      exportedBy:
        Number(
          row.ExportedBy
        ),

      exporterName:
        row.ExporterName ?? null,

      reportType:
        row.ReportType,

      format:
        row.Format,

      filters:
        parseReportFilters(
          row.Filters
        ),

      filename:
        row.FileName ?? null,

      rowCount:
        Number(
          row.RowCount ?? 0
        ),

      status:
        row.Status,

      errorMessage:
        row.ErrorMessage ?? null,

      createdAt:
        row.CreatedAt
          ? new Date(
              row.CreatedAt
            ).toISOString()
          : "",
    })
  );
}

function parseReportFilters(
  value: unknown
): ReportExportHistory["filters"] {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return value as ReportExportHistory["filters"];
  }

  if (typeof value !== "string") {
    return {};
  }

  try {
    return JSON.parse(
      value
    ) as ReportExportHistory["filters"];
  } catch {
    return {};
  }
}