import { getPool, sql } from "@/database/connection";

export async function getDashboardStatsFromDB() {
  const pool = await getPool();

  const queries = `
    -- Today Revenue
    SELECT ISNULL(SUM(TotalAmount), 0) AS TodayRevenue
    FROM Bookings
    WHERE CONVERT(DATE, BookingDate) = CONVERT(DATE, GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time')
      AND Status IN ('Confirmed', 'Completed', 'CheckedIn');

    -- Today Bookings Count
    SELECT COUNT(*) AS TodayBookingsCount
    FROM Bookings
    WHERE CONVERT(DATE, BookingDate) = CONVERT(DATE, GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time');

    -- Active Courts
    SELECT COUNT(*) AS ActiveCourts FROM Courts WHERE Status = 'Active';

    -- Total Courts
    SELECT COUNT(*) AS TotalCourts FROM Courts;

    -- Active Coaches
    SELECT COUNT(*) AS ActiveCoaches FROM Users WHERE Role = 'Coach' AND IsActive = 1;

    -- Latest Bookings (Top 5)
    SELECT TOP 5
      b.BookingCode,
      u.FullName AS PlayerName,
      b.Status,
      bd.StartTime,
      c.CourtName
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN BookingDetails bd ON b.BookingID = bd.BookingID
    LEFT JOIN Courts c ON bd.CourtID = c.CourtID
    ORDER BY b.CreatedAt DESC;
  `;

  const result = await pool.request().query(queries);
  const rs = result.recordsets as any[][];

  return {
    todayRevenue: rs[0][0].TodayRevenue,
    todayBookingsCount: rs[1][0].TodayBookingsCount,
    activeCourts: rs[2][0].ActiveCourts,
    totalCourts: rs[3][0].TotalCourts,
    activeCoaches: rs[4][0].ActiveCoaches,
    latestBookings: rs[5].map((b: any) => ({
      BookingCode: b.BookingCode,
      PlayerName: b.PlayerName,
      CourtName: b.CourtName || "Khu vực HLV",
      StartTime: b.StartTime ? new Date(b.StartTime.getTime() - b.StartTime.getTimezoneOffset() * 60000).toISOString().substring(11, 16) : null,
      Status: b.Status,
    })),
  };
}
