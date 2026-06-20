import { getPool, sql } from "@/database/connection";

export type RevenueServiceType =
  | "Court"
  | "Coach"
  | "Combo";

export interface RevenueQuery {
  fromDate?: string;
  toDate?: string;
  serviceType?: RevenueServiceType;
}

export interface RevenueResponse {
  summary: {
    totalRevenue: number;
    todayRevenue: number;
    monthRevenue: number;
    paidBookings: number;
    refundAmount: number;
  };
  chart: Array<{
    date: string;
    revenue: number;
  }>;
  serviceRevenue: Array<{
    serviceName: string;
    revenue: number;
  }>;
  transactions: Array<{
    id: string;
    customerName: string;
    serviceType: RevenueServiceType;
    amount: number;
    paymentMethod: string;
    status: "Paid" | "Refunded" | "Pending" | "Failed";
    createdAt: string;
  }>;
}

const VALID_SERVICE_TYPES = [
  "Court",
  "Coach",
  "Combo",
] as const;

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseRevenueQuery(
  searchParams: URLSearchParams
): RevenueQuery {
  const fromDate =
    searchParams.get("fromDate") ||
    searchParams.get("startDate") ||
    undefined;

  const toDate =
    searchParams.get("toDate") ||
    searchParams.get("endDate") ||
    undefined;

  const rawServiceType =
    searchParams.get("serviceType") ||
    undefined;

  if (
    fromDate &&
    !isDateString(fromDate)
  ) {
    throw new Error("fromDate phải có dạng YYYY-MM-DD");
  }

  if (
    toDate &&
    !isDateString(toDate)
  ) {
    throw new Error("toDate phải có dạng YYYY-MM-DD");
  }

  if (
    fromDate &&
    toDate &&
    fromDate > toDate
  ) {
    throw new Error("fromDate không được lớn hơn toDate");
  }

  if (
    rawServiceType &&
    !VALID_SERVICE_TYPES.includes(
      rawServiceType as RevenueServiceType
    )
  ) {
    throw new Error("Loại dịch vụ không hợp lệ");
  }

  return {
    fromDate,
    toDate,
    serviceType:
      rawServiceType as
        | RevenueServiceType
        | undefined,
  };
}

function applyRevenueFilters(
  request: sql.Request,
  query: RevenueQuery
) {
  request
    .input(
      "FromDate",
      sql.Date,
      query.fromDate ?? null
    )
    .input(
      "ToDate",
      sql.Date,
      query.toDate ?? null
    )
    .input(
      "ServiceType",
      sql.NVarChar(30),
      query.serviceType ?? null
    );

  const conditions = [
    "1 = 1",
  ];

  if (query.fromDate) {
    conditions.push(
      "CAST(COALESCE(p.PaidAt, p.CreatedAt) AS DATE) >= @FromDate"
    );
  }

  if (query.toDate) {
    conditions.push(
      "CAST(COALESCE(p.PaidAt, p.CreatedAt) AS DATE) <= @ToDate"
    );
  }

  if (query.serviceType) {
    conditions.push(
      "b.BookingType = @ServiceType"
    );
  }

  return conditions.join(
    "\n        AND "
  );
}

export async function getAdminRevenue(
  query: RevenueQuery
): Promise<RevenueResponse> {
  const pool =
    await getPool();

  const request =
    pool.request();

  const filters =
    applyRevenueFilters(
      request,
      query
    );

  const result =
    await request.query(`
      SELECT
        ISNULL(
          SUM(
            CASE
              WHEN p.Status = 'Paid'
                THEN p.Amount
              ELSE 0
            END
          ),
          0
        ) AS TotalRevenue,

        ISNULL(
          SUM(
            CASE
              WHEN p.Status = 'Paid'
                AND CAST(COALESCE(p.PaidAt, p.CreatedAt) AS DATE) =
                  CAST(GETDATE() AS DATE)
                THEN p.Amount
              ELSE 0
            END
          ),
          0
        ) AS TodayRevenue,

        ISNULL(
          SUM(
            CASE
              WHEN p.Status = 'Paid'
                AND YEAR(COALESCE(p.PaidAt, p.CreatedAt)) = YEAR(GETDATE())
                AND MONTH(COALESCE(p.PaidAt, p.CreatedAt)) = MONTH(GETDATE())
                THEN p.Amount
              ELSE 0
            END
          ),
          0
        ) AS MonthRevenue,

        COUNT(
          DISTINCT CASE
            WHEN p.Status = 'Paid'
              THEN p.BookingID
          END
        ) AS PaidBookings,

        ISNULL(
          (
            SELECT SUM(r.RefundAmount)
            FROM Refunds r
            INNER JOIN Payments rp
              ON r.PaymentID = rp.PaymentID
            INNER JOIN Bookings rb
              ON rp.BookingID = rb.BookingID
            WHERE r.Status = 'Completed'
              AND (
                @FromDate IS NULL
                OR CAST(COALESCE(r.ProcessedAt, r.RequestedAt) AS DATE) >= @FromDate
              )
              AND (
                @ToDate IS NULL
                OR CAST(COALESCE(r.ProcessedAt, r.RequestedAt) AS DATE) <= @ToDate
              )
              AND (
                @ServiceType IS NULL
                OR rb.BookingType = @ServiceType
              )
          ),
          0
        ) AS RefundAmount

      FROM Payments p
      INNER JOIN Bookings b
        ON p.BookingID = b.BookingID
      WHERE
        ${filters};

      SELECT
        CONVERT(
          VARCHAR(10),
          CAST(COALESCE(p.PaidAt, p.CreatedAt) AS DATE),
          23
        ) AS RevenueDate,

        ISNULL(SUM(p.Amount), 0) AS Revenue

      FROM Payments p
      INNER JOIN Bookings b
        ON p.BookingID = b.BookingID
      WHERE
        ${filters}
        AND p.Status = 'Paid'
      GROUP BY
        CAST(COALESCE(p.PaidAt, p.CreatedAt) AS DATE)
      ORDER BY
        RevenueDate ASC;

      SELECT
        b.BookingType,
        ISNULL(SUM(p.Amount), 0) AS Revenue
      FROM Payments p
      INNER JOIN Bookings b
        ON p.BookingID = b.BookingID
      WHERE
        ${filters}
        AND p.Status = 'Paid'
      GROUP BY
        b.BookingType
      ORDER BY
        Revenue DESC;

      SELECT TOP 20
        p.PaymentID,
        ISNULL(u.FullName, b.GuestName) AS CustomerName,
        b.BookingType,
        p.Amount,
        p.PaymentMethod,
        p.Status,
        COALESCE(p.PaidAt, p.CreatedAt) AS CreatedAt
      FROM Payments p
      INNER JOIN Bookings b
        ON p.BookingID = b.BookingID
      LEFT JOIN Users u
        ON b.UserID = u.UserID
      WHERE
        ${filters}
      ORDER BY
        COALESCE(p.PaidAt, p.CreatedAt) DESC,
        p.PaymentID DESC;
    `);

  const recordsets =
    result.recordsets as any[][];

  const summary =
    recordsets[0]?.[0] ?? {};

  return {
    summary: {
      totalRevenue:
        Number(summary.TotalRevenue ?? 0),
      todayRevenue:
        Number(summary.TodayRevenue ?? 0),
      monthRevenue:
        Number(summary.MonthRevenue ?? 0),
      paidBookings:
        Number(summary.PaidBookings ?? 0),
      refundAmount:
        Number(summary.RefundAmount ?? 0),
    },

    chart:
      recordsets[1]?.map((row) => ({
        date:
          row.RevenueDate ?? "",
        revenue:
          Number(row.Revenue ?? 0),
      })) ?? [],

    serviceRevenue:
      recordsets[2]?.map((row) => ({
        serviceName:
          row.BookingType ?? "",
        revenue:
          Number(row.Revenue ?? 0),
      })) ?? [],

    transactions:
      recordsets[3]?.map((row) => ({
        id:
          String(row.PaymentID),
        customerName:
          row.CustomerName ?? "Khách vãng lai",
        serviceType:
          row.BookingType,
        amount:
          Number(row.Amount ?? 0),
        paymentMethod:
          row.PaymentMethod ?? "",
        status:
          row.Status,
        createdAt:
          row.CreatedAt
            ? new Date(row.CreatedAt).toISOString()
            : "",
      })) ?? [],
  };
}
