import { getPool, sql } from "@/database/connection";
import type { CreatedBooking } from "./bookings.type";

export async function findUserById(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT UserID, FullName, Email, Status
      FROM Users
      WHERE UserID = @UserID
    `);

  return result.recordset[0] ?? null;
}

export async function findCourtByIdForBooking(courtId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CourtID", sql.Int, courtId)
    .query(`
      SELECT
        CourtID,
        CourtCode,
        CourtName,
        PricePerHour,
        Status,
        OpenTime,
        CloseTime
      FROM Courts
      WHERE CourtID = @CourtID
    `);

  return result.recordset[0] ?? null;
}

export async function findCoachByIdForBooking(coachId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .query(`
      SELECT
        CoachID,
        UserID,
        HourlyRate,
        Status
      FROM Coaches
      WHERE CoachID = @CoachID
    `);

  return result.recordset[0] ?? null;
}

export async function findAvailableCourtSlot(
  courtId: number,
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CourtID", sql.Int, courtId)
    .input("SlotDate", sql.Date, bookingDate)
    .input("StartTime", sql.VarChar(5), startTime)
    .input("EndTime", sql.VarChar(5), endTime)
    .query(`
      SELECT TOP 1
        SlotID,
        CourtID,
        SlotDate,
        CONVERT(VARCHAR(5), StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), EndTime, 108) AS EndTime,
        Price,
        Status
      FROM CourtSlots
      WHERE CourtID = @CourtID
        AND SlotDate = @SlotDate
        AND StartTime = CAST(@StartTime AS TIME)
        AND EndTime = CAST(@EndTime AS TIME)
        AND Status = 'Available'
    `);

  return result.recordset[0] ?? null;
}

export async function findAvailableCoachSchedule(
  coachId: number,
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("CoachID", sql.Int, coachId)
    .input("WorkingDate", sql.Date, bookingDate)
    .input("StartTime", sql.VarChar(5), startTime)
    .input("EndTime", sql.VarChar(5), endTime)
    .query(`
      SELECT TOP 1
        CoachScheduleID,
        CoachID,
        WorkingDate,
        CONVERT(VARCHAR(5), StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), EndTime, 108) AS EndTime,
        Status
      FROM CoachSchedules
      WHERE CoachID = @CoachID
        AND WorkingDate = @WorkingDate
        AND StartTime = CAST(@StartTime AS TIME)
        AND EndTime = CAST(@EndTime AS TIME)
        AND Status = 'Available'
    `);

  return result.recordset[0] ?? null;
}
///////////////////////////////



function generateBookingCode() {
  return `BK-${Date.now()}`;
}

export async function createCourtBooking(data: {
  userId: number;
  courtId: number;
  slotId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  courtFee: number;
}): Promise<CreatedBooking> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    const request = new sql.Request(transaction);

    const bookingCode = generateBookingCode();

    const result = await request
      .input("BookingCode", sql.NVarChar(50), bookingCode)
      .input("UserID", sql.Int, data.userId)
      .input("BookingType", sql.NVarChar(30), "Court")
      .input("BookingDate", sql.Date, data.bookingDate)
      .input("CourtFee", sql.Decimal(18, 2), data.courtFee)
      .input("CoachFee", sql.Decimal(18, 2), 0)
      .input("DiscountAmount", sql.Decimal(18, 2), 0)
      .input("TotalAmount", sql.Decimal(18, 2), data.courtFee)
      .input("SlotID", sql.Int, data.slotId)
      .input("CourtID", sql.Int, data.courtId)
      .input("StartTime", sql.VarChar(5), data.startTime)
      .input("EndTime", sql.VarChar(5), data.endTime)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM CourtSlots WITH (UPDLOCK, HOLDLOCK)
          WHERE SlotID = @SlotID
            AND Status = 'Available'
        )
        BEGIN
          THROW 50001, 'Court slot is not available', 1;
        END;

        INSERT INTO Bookings (
          BookingCode,
          UserID,
          BookingType,
          BookingDate,
          CourtFee,
          CoachFee,
          DiscountAmount,
          TotalAmount,
          Status
        )
        OUTPUT INSERTED.*
        VALUES (
          @BookingCode,
          @UserID,
          @BookingType,
          @BookingDate,
          @CourtFee,
          @CoachFee,
          @DiscountAmount,
          @TotalAmount,
          'PendingPayment'
        );

        DECLARE @NewBookingID INT = SCOPE_IDENTITY();

        INSERT INTO BookingDetails (
          BookingID,
          SlotID,
          CourtID,
          CoachID,
          CoachScheduleID,
          BookingDate,
          StartTime,
          EndTime,
          CourtFee,
          CoachFee,
          SubTotal
        )
        VALUES (
          @NewBookingID,
          @SlotID,
          @CourtID,
          NULL,
          NULL,
          @BookingDate,
          CAST(@StartTime AS TIME),
          CAST(@EndTime AS TIME),
          @CourtFee,
          0,
          @CourtFee
        );

        UPDATE CourtSlots
        SET Status = 'Holding',
            HoldUntil = DATEADD(MINUTE, 10, GETDATE()),
            UpdatedAt = GETDATE()
        WHERE SlotID = @SlotID;

        SELECT
          b.BookingID,
          b.BookingCode,
          b.UserID,
          b.BookingType,
          b.BookingDate,
          b.CourtFee,
          b.CoachFee,
          b.DiscountAmount,
          b.TotalAmount,
          b.Status,
          b.CreatedAt,
          bd.BookingDetailID,
          bd.SlotID,
          bd.CourtID,
          bd.CoachID,
          bd.CoachScheduleID,
          CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
          CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime
        FROM Bookings b
        JOIN BookingDetails bd ON bd.BookingID = b.BookingID
        WHERE b.BookingID = @NewBookingID;
      `);

    await transaction.commit();

    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function createCoachBooking(data: {
  userId: number;
  coachId: number;
  coachScheduleId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  coachFee: number;
}): Promise<CreatedBooking> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    const request = new sql.Request(transaction);

    const bookingCode = generateBookingCode();

    const result = await request
      .input("BookingCode", sql.NVarChar(50), bookingCode)
      .input("UserID", sql.Int, data.userId)
      .input("BookingType", sql.NVarChar(30), "Coach")
      .input("BookingDate", sql.Date, data.bookingDate)
      .input("CourtFee", sql.Decimal(18, 2), 0)
      .input("CoachFee", sql.Decimal(18, 2), data.coachFee)
      .input("DiscountAmount", sql.Decimal(18, 2), 0)
      .input("TotalAmount", sql.Decimal(18, 2), data.coachFee)
      .input("CoachID", sql.Int, data.coachId)
      .input("CoachScheduleID", sql.Int, data.coachScheduleId)
      .input("StartTime", sql.VarChar(5), data.startTime)
      .input("EndTime", sql.VarChar(5), data.endTime)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM CoachSchedules WITH (UPDLOCK, HOLDLOCK)
          WHERE CoachScheduleID = @CoachScheduleID
            AND Status = 'Available'
        )
        BEGIN
          THROW 50002, 'Coach schedule is not available', 1;
        END;

        INSERT INTO Bookings (
          BookingCode,
          UserID,
          BookingType,
          BookingDate,
          CourtFee,
          CoachFee,
          DiscountAmount,
          TotalAmount,
          Status
        )
        VALUES (
          @BookingCode,
          @UserID,
          @BookingType,
          @BookingDate,
          @CourtFee,
          @CoachFee,
          @DiscountAmount,
          @TotalAmount,
          'PendingPayment'
        );

        DECLARE @NewBookingID INT = SCOPE_IDENTITY();

        INSERT INTO BookingDetails (
          BookingID,
          SlotID,
          CourtID,
          CoachID,
          CoachScheduleID,
          BookingDate,
          StartTime,
          EndTime,
          CourtFee,
          CoachFee,
          SubTotal
        )
        VALUES (
          @NewBookingID,
          NULL,
          NULL,
          @CoachID,
          @CoachScheduleID,
          @BookingDate,
          CAST(@StartTime AS TIME),
          CAST(@EndTime AS TIME),
          0,
          @CoachFee,
          @CoachFee
        );

        UPDATE CoachSchedules
        SET Status = 'Holding',
            HoldUntil = DATEADD(MINUTE, 10, GETDATE()),
            UpdatedAt = GETDATE()
        WHERE CoachScheduleID = @CoachScheduleID;

        SELECT
          b.BookingID,
          b.BookingCode,
          b.UserID,
          b.BookingType,
          b.BookingDate,
          b.CourtFee,
          b.CoachFee,
          b.DiscountAmount,
          b.TotalAmount,
          b.Status,
          b.CreatedAt,
          bd.BookingDetailID,
          bd.SlotID,
          bd.CourtID,
          bd.CoachID,
          bd.CoachScheduleID,
          CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
          CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime
        FROM Bookings b
        JOIN BookingDetails bd ON bd.BookingID = b.BookingID
        WHERE b.BookingID = @NewBookingID;
      `);

    await transaction.commit();

    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
export async function findBookingsByUserId(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT
        b.BookingID,
        b.BookingCode,
        b.UserID,
        b.BookingType,
        b.BookingDate,
        b.CourtFee,
        b.CoachFee,
        b.DiscountAmount,
        b.TotalAmount,
        b.Status,
        b.CheckInTime,
        b.CancelledAt,
        b.CancelReason,
        b.CreatedAt,

        bd.BookingDetailID,
        bd.SlotID,
        bd.CourtID,
        c.CourtName,
        c.CourtCode,
        c.CourtImage,
        c.Location,

        bd.CoachID,
        cu.FullName AS CoachName,
        cu.AvatarURL AS CoachAvatar,

        bd.CoachScheduleID,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,

        p.PaymentID,
        p.PaymentMethod,
        p.TransactionCode,
        p.Status AS PaymentStatus,
        p.PaidAt
      FROM Bookings b
      LEFT JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      LEFT JOIN Courts c ON bd.CourtID = c.CourtID
      LEFT JOIN Coaches co ON bd.CoachID = co.CoachID
      LEFT JOIN Users cu ON co.UserID = cu.UserID
      LEFT JOIN Payments p ON p.BookingID = b.BookingID
      WHERE b.UserID = @UserID
      ORDER BY b.CreatedAt DESC
    `);

  return result.recordset;
}

export async function findBookingById(bookingId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      SELECT
        b.BookingID,
        b.BookingCode,
        b.UserID,
        b.BookingType,
        b.BookingDate,
        b.CourtFee,
        b.CoachFee,
        b.DiscountAmount,
        b.TotalAmount,
        b.Status,
        b.CheckInTime,
        b.CancelledAt,
        b.CancelReason,
        b.CreatedAt,

        bd.BookingDetailID,
        bd.SlotID,
        bd.CourtID,
        c.CourtName,
        c.CourtCode,
        c.CourtImage,
        c.Location,

        bd.CoachID,
        cu.FullName AS CoachName,
        cu.AvatarURL AS CoachAvatar,

        bd.CoachScheduleID,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,

        p.PaymentID,
        p.PaymentMethod,
        p.TransactionCode,
        p.Status AS PaymentStatus,
        p.PaidAt
      FROM Bookings b
      LEFT JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      LEFT JOIN Courts c ON bd.CourtID = c.CourtID
      LEFT JOIN Coaches co ON bd.CoachID = co.CoachID
      LEFT JOIN Users cu ON co.UserID = cu.UserID
      LEFT JOIN Payments p ON p.BookingID = b.BookingID
      WHERE b.BookingID = @BookingID
    `);

  return result.recordset[0] ?? null;
}


export async function createComboBooking(input: {
  userId: number;
  courtId: number;
  coachId: number;
  slotId: number;
  coachScheduleId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  courtFee: number;
  coachFee: number;
}) {
  const pool = await getPool();

  const totalAmount = input.courtFee + input.coachFee;
  const bookingCode = `CB-${Date.now()}`;

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const bookingResult = await new sql.Request(transaction)
      .input("BookingCode", sql.VarChar(50), bookingCode)
      .input("UserID", sql.Int, input.userId)
      .input("BookingType", sql.VarChar(20), "Combo")
      .input("BookingDate", sql.Date, input.bookingDate)
      .input("CourtFee", sql.Decimal(18, 2), input.courtFee)
      .input("CoachFee", sql.Decimal(18, 2), input.coachFee)
      .input("DiscountAmount", sql.Decimal(18, 2), 0)
      .input("TotalAmount", sql.Decimal(18, 2), totalAmount)
      .input("Status", sql.VarChar(30), "PendingPayment")
      .query(`
        INSERT INTO Bookings (
          BookingCode,
          UserID,
          BookingType,
          BookingDate,
          CourtFee,
          CoachFee,
          DiscountAmount,
          TotalAmount,
          Status,
          CreatedAt
        )
        OUTPUT INSERTED.BookingID
        VALUES (
          @BookingCode,
          @UserID,
          @BookingType,
          @BookingDate,
          @CourtFee,
          @CoachFee,
          @DiscountAmount,
          @TotalAmount,
          @Status,
          GETDATE()
        )
      `);

    const bookingId = bookingResult.recordset[0].BookingID;

    await new sql.Request(transaction)
      .input("BookingID", sql.Int, bookingId)
      .input("SlotID", sql.Int, input.slotId)
      .input("CourtID", sql.Int, input.courtId)
      .input("CoachID", sql.Int, input.coachId)
      .input("CoachScheduleID", sql.Int, input.coachScheduleId)
      .input("BookingDate", sql.Date, input.bookingDate)
      .input("StartTime", sql.VarChar(20), input.startTime)
      .input("EndTime", sql.VarChar(20), input.endTime)
      .input("CourtFee", sql.Decimal(18, 2), input.courtFee)
      .input("CoachFee", sql.Decimal(18, 2), input.coachFee)
      .input("SubTotal", sql.Decimal(18, 2), totalAmount)
      .query(`
        INSERT INTO BookingDetails (
          BookingID,
          SlotID,
          CourtID,
          CoachID,
          CoachScheduleID,
          BookingDate,
          StartTime,
          EndTime,
          CourtFee,
          CoachFee,
          SubTotal
        )
        VALUES (
          @BookingID,
          @SlotID,
          @CourtID,
          @CoachID,
          @CoachScheduleID,
          @BookingDate,
          @StartTime,
          @EndTime,
          @CourtFee,
          @CoachFee,
          @SubTotal
        )
      `);

    await new sql.Request(transaction)
      .input("SlotID", sql.Int, input.slotId)
      .query(`
        UPDATE CourtSlots
        SET Status = 'Booked'
        WHERE SlotID = @SlotID
      `);

    await new sql.Request(transaction)
      .input("CoachScheduleID", sql.Int, input.coachScheduleId)
      .query(`
        UPDATE CoachSchedules
        SET Status = 'Booked'
        WHERE CoachScheduleID = @CoachScheduleID
      `);

    await transaction.commit();

    return {
      bookingId,
      bookingCode,
      bookingType: "Combo",
      status: "PendingPayment",
      courtFee: input.courtFee,
      coachFee: input.coachFee,
      totalAmount,
      message: "Create combo booking successfully",
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}