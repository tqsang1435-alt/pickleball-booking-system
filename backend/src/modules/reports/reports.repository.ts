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
