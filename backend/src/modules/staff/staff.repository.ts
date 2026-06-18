import { getPool, sql } from "@/database/connection";
import type { StaffDashboardStatsResult, CourtStatusResult, IncidentReportResult } from "./staff.types";

export async function repoGetStaffDashboardStats(today: string): Promise<StaffDashboardStatsResult> {
  const pool = await getPool();

  // Total bookings today
  const totalResult = await pool.request()
    .input("Today", sql.Date, today)
    .query(`
      SELECT COUNT(*) AS TotalBookings
      FROM Bookings
      WHERE BookingDate = @Today
        AND Status IN ('Confirmed', 'Paid', 'CheckedIn', 'Completed')
    `);

  // Check-ins today
  const checkInResult = await pool.request()
    .input("Today", sql.Date, today)
    .query(`
      SELECT COUNT(*) AS CheckInsCount
      FROM Bookings
      WHERE BookingDate = @Today
        AND Status IN ('CheckedIn', 'Completed')
        AND CheckInTime IS NOT NULL
    `);

  // Revenue today
  const revenueResult = await pool.request()
    .input("Today", sql.Date, today)
    .query(`
      SELECT ISNULL(SUM(TotalAmount), 0) AS TodayRevenue
      FROM Bookings
      WHERE BookingDate = @Today
        AND Status IN ('Confirmed', 'Paid', 'CheckedIn', 'Completed')
    `);

  // Upcoming bookings (next 2 hours) - Confirmed status
  const upcomingResult = await pool.request()
    .input("Today", sql.Date, today)
    .query(`
      SELECT
        b.BookingID,
        b.BookingCode,
        ISNULL(b.GuestName, u.FullName) AS CustomerName,
        c.CourtName,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,
        b.Status
      FROM Bookings b
      JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      LEFT JOIN Courts c ON c.CourtID = bd.CourtID
      LEFT JOIN Users u ON u.UserID = b.UserID
      WHERE b.BookingDate = @Today
        AND b.Status IN ('Confirmed', 'Paid')
        AND CAST(CONCAT(CAST(b.BookingDate AS VARCHAR(10)), ' ', CONVERT(VARCHAR(5), bd.StartTime, 108)) AS DATETIME)
            BETWEEN GETDATE() AND DATEADD(HOUR, 2, GETDATE())
      ORDER BY bd.StartTime ASC
    `);

  // Pending check-ins (within ±15 min window)
  const pendingCheckInResult = await pool.request()
    .input("Today", sql.Date, today)
    .query(`
      SELECT
        b.BookingID,
        b.BookingCode,
        ISNULL(b.GuestName, u.FullName) AS CustomerName,
        c.CourtName,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,
        b.Status
      FROM Bookings b
      JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      LEFT JOIN Courts c ON c.CourtID = bd.CourtID
      LEFT JOIN Users u ON u.UserID = b.UserID
      WHERE b.BookingDate = @Today
        AND b.Status IN ('Confirmed', 'Paid')
        AND ABS(DATEDIFF(MINUTE,
            CAST(CONCAT(CAST(b.BookingDate AS VARCHAR(10)), ' ', CONVERT(VARCHAR(5), bd.StartTime, 108)) AS DATETIME),
            GETDATE()
        )) <= 15
      ORDER BY bd.StartTime ASC
    `);

  const now = new Date();
  const upcomingBookings = upcomingResult.recordset.map((row: any) => {
    const startDateTime = new Date(`${today}T${row.StartTime}:00`);
    const diffMs = startDateTime.getTime() - now.getTime();
    const withinWindow = Math.abs(diffMs) <= 15 * 60 * 1000;
    return {
      bookingId: row.BookingID,
      bookingCode: row.BookingCode,
      customerName: row.CustomerName || 'Khách vãng lai',
      courtName: row.CourtName || 'N/A',
      startTime: row.StartTime,
      endTime: row.EndTime,
      status: row.Status,
      canCheckIn: withinWindow,
    };
  });

  const pendingCheckIns = pendingCheckInResult.recordset.map((row: any) => ({
    bookingId: row.BookingID,
    bookingCode: row.BookingCode,
    customerName: row.CustomerName || 'Khách vãng lai',
    courtName: row.CourtName || 'N/A',
    startTime: row.StartTime,
    endTime: row.EndTime,
    status: row.Status,
    canCheckIn: true,
  }));

  return {
    totalBookings: totalResult.recordset[0]?.TotalBookings ?? 0,
    checkInsCount: checkInResult.recordset[0]?.CheckInsCount ?? 0,
    todayRevenue: Number(revenueResult.recordset[0]?.TodayRevenue ?? 0),
    upcomingBookings,
    pendingCheckIns,
  };
}

export async function repoMarkBookingNoShow(bookingId: number, staffId: number): Promise<void> {
  const pool = await getPool();

  const result = await pool.request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      SELECT
        b.BookingID,
        b.Status,
        b.BookingDate,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime
      FROM Bookings b
      JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      WHERE b.BookingID = @BookingID
    `);

  if (!result.recordset[0]) {
    throw Object.assign(new Error("Không tìm thấy booking"), { statusCode: 404 });
  }

  const booking = result.recordset[0];
  if (!['Confirmed', 'Paid'].includes(booking.Status)) {
    throw Object.assign(new Error("Chỉ có thể đánh dấu vắng mặt cho booking đang ở trạng thái Confirmed hoặc Paid"), { statusCode: 400 });
  }

  // Check that check-in window has fully passed (more than 15 min after start)
  const bookingDateStr = booking.BookingDate instanceof Date
    ? booking.BookingDate.toISOString().split('T')[0]
    : String(booking.BookingDate).split('T')[0];
  const startDateTime = new Date(`${bookingDateStr}T${booking.StartTime}:00`);
  const now = new Date();
  const diffMinutes = (now.getTime() - startDateTime.getTime()) / 60000;

  if (diffMinutes <= 15) {
    throw Object.assign(new Error("Khách vẫn còn trong cửa sổ check-in (15 phút). Vui lòng đợi thêm."), { statusCode: 400 });
  }

  await pool.request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      UPDATE Bookings
      SET Status = 'NoShow',
          UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID
        AND Status IN ('Confirmed', 'Paid')
    `);
}

export async function repoMarkBookingCompleted(bookingId: number, staffId: number): Promise<void> {
  const pool = await getPool();

  const result = await pool.request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      SELECT b.BookingID, b.Status
      FROM Bookings b
      WHERE b.BookingID = @BookingID
    `);

  if (!result.recordset[0]) {
    throw Object.assign(new Error("Không tìm thấy booking"), { statusCode: 404 });
  }

  if (result.recordset[0].Status !== 'CheckedIn') {
    throw Object.assign(new Error("Chỉ có thể xác nhận hoàn thành cho booking đang ở trạng thái CheckedIn"), { statusCode: 400 });
  }

  await pool.request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      UPDATE Bookings
      SET Status = 'Completed',
          UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID
        AND Status = 'CheckedIn';

      -- Release court slot
      UPDATE CourtSlots
      SET Status = 'Available', HoldUntil = NULL, UpdatedAt = GETDATE()
      WHERE SlotID IN (
        SELECT SlotID FROM BookingDetails WHERE BookingID = @BookingID AND SlotID IS NOT NULL
      );
    `);
}

export async function repoGetCourtStatusBoard(today: string): Promise<CourtStatusResult[]> {
  const pool = await getPool();

  const courtsResult = await pool.request().query(`
    SELECT CourtID, CourtName, CourtCode FROM Courts WHERE Status = 'Active' ORDER BY CourtName
  `);

  const activeBookingsResult = await pool.request()
    .input("Today", sql.Date, today)
    .query(`
      SELECT
        b.BookingID,
        b.BookingCode,
        bd.CourtID,
        ISNULL(b.GuestName, u.FullName) AS CustomerName,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,
        b.Status
      FROM Bookings b
      JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      LEFT JOIN Users u ON u.UserID = b.UserID
      WHERE b.BookingDate = @Today
        AND b.Status IN ('CheckedIn', 'Confirmed', 'Paid')
        AND bd.CourtID IS NOT NULL
        AND CAST(CONCAT(CAST(b.BookingDate AS VARCHAR(10)), ' ', CONVERT(VARCHAR(5), bd.StartTime, 108)) AS DATETIME) <= DATEADD(MINUTE, 30, GETDATE())
        AND CAST(CONCAT(CAST(b.BookingDate AS VARCHAR(10)), ' ', CONVERT(VARCHAR(5), bd.EndTime, 108)) AS DATETIME) > GETDATE()
    `);

  const now = new Date();
  const bookingsByCourtId = new Map<number, any[]>();
  for (const row of activeBookingsResult.recordset) {
    if (!bookingsByCourtId.has(row.CourtID)) {
      bookingsByCourtId.set(row.CourtID, []);
    }
    bookingsByCourtId.get(row.CourtID)!.push(row);
  }

  return courtsResult.recordset.map((court: any) => {
    const bookings = bookingsByCourtId.get(court.CourtID) || [];
    const activeBooking = bookings.find((b: any) => b.Status === 'CheckedIn');
    const upcomingBooking = bookings.find((b: any) => b.Status === 'Confirmed' || b.Status === 'Paid');

    let currentStatus: 'Available' | 'InUse' | 'Upcoming' | 'Empty' = 'Empty';
    if (activeBooking) currentStatus = 'InUse';
    else if (upcomingBooking) currentStatus = 'Upcoming';
    else if (bookings.length === 0) currentStatus = 'Available';

    const toMinutes = (timeStr: string): number => {
      const startDt = new Date(`${today}T${timeStr}:00`);
      return Math.round((startDt.getTime() - now.getTime()) / 60000);
    };

    return {
      courtId: court.CourtID,
      courtName: court.CourtName,
      courtCode: court.CourtCode,
      currentStatus,
      activeBooking: activeBooking ? {
        bookingId: activeBooking.BookingID,
        bookingCode: activeBooking.BookingCode,
        customerName: activeBooking.CustomerName || 'Khách vãng lai',
        startTime: activeBooking.StartTime,
        endTime: activeBooking.EndTime,
        minutesRemaining: Math.max(0, toMinutes(activeBooking.EndTime)),
      } : null,
      upcomingBooking: upcomingBooking ? {
        bookingId: upcomingBooking.BookingID,
        bookingCode: upcomingBooking.BookingCode,
        customerName: upcomingBooking.CustomerName || 'Khách vãng lai',
        startTime: upcomingBooking.StartTime,
        minutesUntilStart: Math.max(0, toMinutes(upcomingBooking.StartTime)),
      } : null,
    };
  });
}

export async function repoCreateIncidentReport(data: {
  staffId: number;
  courtId: number;
  incidentType: string;
  description: string;
  urgency: string;
}): Promise<{ incidentId: number }> {
  const pool = await getPool();

  // Check if IncidentReports table exists, create if not
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IncidentReports')
    BEGIN
      CREATE TABLE IncidentReports (
        IncidentID INT PRIMARY KEY IDENTITY(1,1),
        StaffID INT NOT NULL,
        CourtID INT NOT NULL,
        IncidentType NVARCHAR(50) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        Urgency NVARCHAR(20) NOT NULL DEFAULT 'Low',
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_IncidentReports_Staff FOREIGN KEY (StaffID) REFERENCES Users(UserID),
        CONSTRAINT FK_IncidentReports_Court FOREIGN KEY (CourtID) REFERENCES Courts(CourtID)
      );
    END
  `);

  const result = await pool.request()
    .input("StaffID", sql.Int, data.staffId)
    .input("CourtID", sql.Int, data.courtId)
    .input("IncidentType", sql.NVarChar(50), data.incidentType)
    .input("Description", sql.NVarChar(sql.MAX), data.description)
    .input("Urgency", sql.NVarChar(20), data.urgency)
    .query(`
      INSERT INTO IncidentReports (StaffID, CourtID, IncidentType, Description, Urgency, Status, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.IncidentID
      VALUES (@StaffID, @CourtID, @IncidentType, @Description, @Urgency, 'Pending', GETUTCDATE(), GETUTCDATE())
    `);

  return { incidentId: result.recordset[0].IncidentID };
}

export async function repoGetIncidentsByStaff(staffId: number): Promise<IncidentReportResult[]> {
  const pool = await getPool();

  // Ensure table exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IncidentReports')
    BEGIN
      CREATE TABLE IncidentReports (
        IncidentID INT PRIMARY KEY IDENTITY(1,1),
        StaffID INT NOT NULL,
        CourtID INT NOT NULL,
        IncidentType NVARCHAR(50) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        Urgency NVARCHAR(20) NOT NULL DEFAULT 'Low',
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_IncidentReports_Staff FOREIGN KEY (StaffID) REFERENCES Users(UserID),
        CONSTRAINT FK_IncidentReports_Court FOREIGN KEY (CourtID) REFERENCES Courts(CourtID)
      );
    END
  `);

  const result = await pool.request()
    .input("StaffID", sql.Int, staffId)
    .query(`
      SELECT
        ir.IncidentID,
        ir.CourtID,
        c.CourtName,
        ir.IncidentType,
        ir.Description,
        ir.Urgency,
        ir.Status,
        ir.CreatedAt,
        u.FullName AS StaffName
      FROM IncidentReports ir
      JOIN Courts c ON c.CourtID = ir.CourtID
      JOIN Users u ON u.UserID = ir.StaffID
      WHERE ir.StaffID = @StaffID
      ORDER BY ir.CreatedAt DESC
    `);

  return result.recordset.map((row: any) => ({
    incidentId: row.IncidentID,
    courtId: row.CourtID,
    courtName: row.CourtName,
    incidentType: row.IncidentType,
    description: row.Description,
    urgency: row.Urgency,
    status: row.Status,
    createdAt: row.CreatedAt,
    staffName: row.StaffName,
  }));
}
