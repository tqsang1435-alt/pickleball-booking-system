import { sql, getPool } from "@/database/connection";
import { OperationBooking } from "./operations.type";

export async function repoGetTodayOperations(targetDate: string): Promise<OperationBooking[]> {
  const pool = await getPool();
  // Lấy danh sách booking trong ngày
  const query = `
    SELECT 
      b.BookingID as bookingId,
      b.BookingCode as bookingCode,
      u.FullName as customerName,
      u.PhoneNumber as customerPhone,
      u.Email as customerEmail,
      c.CourtName as courtName,
      b.BookingDate as bookingDate,
      CONVERT(VARCHAR(5), bd.StartTime, 108) as startTime,
      CONVERT(VARCHAR(5), bd.EndTime, 108) as endTime,
      b.Status as status,
      p.Status as paymentStatus,
      b.CheckInTime as checkInTime
    FROM Bookings b
    INNER JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN BookingDetails bd ON b.BookingID = bd.BookingID
    LEFT JOIN Courts c ON bd.CourtID = c.CourtID
    LEFT JOIN Payments p ON b.BookingID = p.BookingID
    WHERE b.BookingDate = @TargetDate
    ORDER BY bd.StartTime ASC
  `;
  
  const result = await pool.request()
    .input("TargetDate", sql.Date, targetDate)
    .query(query);
    
  return result.recordset.map((row) => ({
    bookingId: row.bookingId,
    bookingCode: row.bookingCode,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    courtName: row.courtName,
    bookingDate: row.bookingDate.toISOString().split('T')[0],
    startTime: row.startTime || '',
    endTime: row.endTime || '',
    status: row.status,
    paymentStatus: row.paymentStatus,
    checkInTime: row.checkInTime ? row.checkInTime.toISOString() : null,
  }));
}

export async function repoUpdateBookingStatus(
  bookingId: number, 
  status: string, 
  note?: string,
  setCheckInTime: boolean = false
): Promise<void> {
  const pool = await getPool();
  let query = `UPDATE Bookings SET Status = @Status, UpdatedAt = GETDATE()`;
  
  if (setCheckInTime) {
    query += `, CheckInTime = GETDATE()`;
  }
  
  if (note && status === 'NoShow') {
    query += `, CancelReason = @Note`;
  }
  
  query += ` WHERE BookingID = @BookingID`;

  const request = pool.request()
    .input("Status", sql.NVarChar, status)
    .input("BookingID", sql.Int, bookingId);
    
  if (note && status === 'NoShow') {
    request.input("Note", sql.NVarChar, note);
  }

  await request.query(query);
}

export async function repoGetBookingStatus(bookingId: number): Promise<{ Status: string, BookingCode: string, BookingDate: Date, StartTime: Date, EndTime: Date } | null> {
  const pool = await getPool();
  const query = `
    SELECT 
      b.Status, 
      b.BookingCode,
      b.BookingDate,
      bd.StartTime,
      bd.EndTime
    FROM Bookings b
    LEFT JOIN BookingDetails bd ON b.BookingID = bd.BookingID
    WHERE b.BookingID = @BookingID
  `;
  const result = await pool.request()
    .input("BookingID", sql.Int, bookingId)
    .query(query);
    
  if (result.recordset.length === 0) return null;
  return result.recordset[0];
}

export async function repoGetBookingLogs(bookingId: number) {
  const pool = await getPool();
  const query = `
    SELECT 
      al.AuditLogID as logId,
      al.ActionName as action,
      al.Description as note,
      al.CreatedAt as createdAt,
      u.FullName as actorName
    FROM AuditLogs al
    LEFT JOIN Users u ON al.UserID = u.UserID
    WHERE al.TableName = 'Bookings' AND al.EntityID = @BookingID
    ORDER BY al.CreatedAt DESC
  `;
  const result = await pool.request()
    .input("BookingID", sql.Int, bookingId)
    .query(query);
    
    return result.recordset.map(row => ({
    logId: row.logId,
    action: row.action,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    actorName: row.actorName || "System"
  }));
}

export async function repoGetExpiredConfirmedBookings(targetDate: string): Promise<{ BookingID: number, BookingCode: string, UserID: number, CoachID: number | null, BookingDate: Date, StartTime: Date, EndTime: Date }[]> {
  const pool = await getPool();
  const query = `
    SELECT 
      b.BookingID, 
      b.BookingCode,
      b.UserID,
      coachDetail.CoachID AS CoachID,
      b.BookingDate,
      MIN(bd.StartTime) as StartTime,
      MAX(bd.EndTime) as EndTime
    FROM Bookings b
    LEFT JOIN BookingDetails bd ON b.BookingID = bd.BookingID
    OUTER APPLY (
        SELECT TOP 1 inner_bd.CoachID
        FROM BookingDetails inner_bd
        WHERE inner_bd.BookingID = b.BookingID
          AND inner_bd.CoachID IS NOT NULL
    ) coachDetail
    WHERE b.BookingDate = @TargetDate AND b.Status = 'Confirmed'
    GROUP BY
      b.BookingID,
      b.BookingCode,
      b.UserID,
      coachDetail.CoachID,
      b.BookingDate
  `;
  const result = await pool.request()
    .input("TargetDate", sql.Date, targetDate)
    .query(query);
    
  return result.recordset;
}
