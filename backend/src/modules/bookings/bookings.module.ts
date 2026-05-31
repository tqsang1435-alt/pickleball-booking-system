import { NextRequest } from "next/server";
import { getPool, sql } from "@/database/connection";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import { requestRefund } from "@/modules/refunds/refunds.service";
import { createNotification } from "@/modules/notifications/notifications.service";

// ============================================================
// TYPES
// ============================================================

export type BookingType = "Court" | "Coach" | "Combo";

export type CreateCourtBookingInput = {
  userId: number;
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreateCoachBookingInput = {
  userId: number;
  coachId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreateComboBookingInput = {
  userId: number;
  courtId: number;
  coachId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreatedBooking = {
  BookingID: number;
  BookingCode: string;
  UserID: number;
  BookingType: BookingType;
  BookingDate: string;
  CourtFee: number;
  CoachFee: number;
  DiscountAmount: number;
  TotalAmount: number;
  Status: string;
  CreatedAt: string;

  BookingDetailID: number;
  SlotID: number | null;
  CourtID: number | null;
  CoachID: number | null;
  CoachScheduleID: number | null;
  StartTime: string;
  EndTime: string;
};

// ===== Cancel Booking =====
export type CancelBookingInput = {
  bookingId: number;
  userId: number;
  userRoles: string[];
  cancelReason?: string;
};

export type CancelBookingResult = {
  bookingId: number;
  status: string;
  refundAmount: number;
  refundPercent: number;
  refundNote: string;
  refundRecord: object | null;
};

// ===== Check-in =====
export type CheckInInput = {
  bookingId: number;
  userId: number;
  userRoles?: string[];
};

export type CheckInResult = {
  bookingId: number;
  status: string;
  checkInTime: string;
};

// ===== Booking detail with payment (UC-19) =====
export type BookingWithPayment = {
  BookingID: number;
  BookingCode: string;
  UserID: number;
  BookingType: BookingType;
  BookingDate: string;
  CourtFee: number;
  CoachFee: number;
  DiscountAmount: number;
  TotalAmount: number;
  Status: string;
  CheckInTime: string | null;
  CancelledAt: string | null;
  CancelReason: string | null;
  CreatedAt: string;
  StartTime: string;
  EndTime: string;

  // Court info
  CourtID: number | null;
  CourtName: string | null;
  CourtCode: string | null;
  CourtImage: string | null;
  Location: string | null;

  // Coach info
  CoachID: number | null;
  CoachName: string | null;
  CoachAvatar: string | null;

  // Payment info
  PaymentID: number | null;
  PaymentMethod: string | null;
  TransactionCode: string | null;
  PaymentStatus: string | null;
  PaidAt: string | null;
};

// ===== Daily booking (UC-49) =====
export type DailyBooking = {
  BookingID: number;
  BookingCode: string;
  BookingType: BookingType;
  BookingDate: string;
  StartTime: string;
  EndTime: string;
  TotalAmount: number;
  Status: string;
  CheckInTime: string | null;

  PlayerName: string;
  PlayerEmail: string;
  PlayerPhone: string | null;

  CourtName: string | null;
  CoachName: string | null;

  PaymentMethod: string | null;
  PaymentStatus: string | null;
};

// ============================================================
// REPOSITORY
// ============================================================

// ---- Find / Lookup ----

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

/**
 * Tim slot san kha dung, dong thoi kiem tra buffer 15 phut (BR-46 phan Court Slot).
 * Slot phai Status = 'Available', khong co slot nao Holding/Booked trong khoang buffer.
 */
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

/**
 * Tim lich HLV kha dung, co kiem tra buffer time 15 phut (BR-46).
 * Lich phai Status = 'Available'.
 * Khong co lich nao cua HLV dang Holding/Booked trong khoang (StartTime-15min, EndTime+15min).
 */
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
      -- BR-46: Kiem tra buffer 15 phut truoc/sau
      IF EXISTS (
        SELECT 1
        FROM CoachSchedules
        WHERE CoachID = @CoachID
          AND WorkingDate = @WorkingDate
          AND Status IN ('Holding', 'Booked')
          AND (
            -- Slot khac overlap voi khoang (start-15, end+15)
            StartTime < DATEADD(MINUTE, 15, CAST(@EndTime AS TIME))
            AND EndTime > DATEADD(MINUTE, -15, CAST(@StartTime AS TIME))
          )
      )
      BEGIN
        SELECT NULL AS CoachScheduleID, NULL AS CoachID, NULL AS WorkingDate,
               NULL AS StartTime, NULL AS EndTime, NULL AS Status
        WHERE 1 = 0; -- tra ve empty
      END
      ELSE
      BEGIN
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
          AND Status = 'Available';
      END
    `);

  return result.recordset[0] ?? null;
}

/**
 * Dem so booking dang o trang thai Holding cua 1 user.
 * Dung de kiem tra BR-40: toi da 3 Holding cung luc.
 */
export async function countHoldingBookingsByUserId(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS HoldingCount
      FROM Bookings
      WHERE UserID = @UserID
        AND Status = 'PendingPayment'
    `);

  return (result.recordset[0]?.HoldingCount ?? 0) as number;
}

/**
 * Tim booking theo ID kem thong tin payment.
 * Dung cho cancel (can TotalAmount, StartTime, BookingDate, PaymentInfo).
 */
export async function findBookingWithPaymentById(bookingId: number) {
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
        bd.CoachID,
        bd.CoachScheduleID,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,

        p.PaymentID,
        p.PaymentMethod,
        p.Amount AS PaidAmount,
        p.TransactionCode,
        p.Status AS PaymentStatus,
        p.PaidAt
      FROM Bookings b
      LEFT JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      LEFT JOIN Payments p ON p.BookingID = b.BookingID AND p.Status = 'Paid'
      WHERE b.BookingID = @BookingID
    `);

  return result.recordset[0] ?? null;
}

// ---- Create Bookings ----

function generateBookingCode() {
  return `BK-${Date.now()}`;
}

export async function repoCreateCourtBooking(data: {
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
        -- BR-27/28: Lock slot truoc khi insert
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
          BookingCode, UserID, BookingType, BookingDate,
          CourtFee, CoachFee, DiscountAmount, TotalAmount, Status
        )
        OUTPUT INSERTED.*
        VALUES (
          @BookingCode, @UserID, @BookingType, @BookingDate,
          @CourtFee, @CoachFee, @DiscountAmount, @TotalAmount, 'PendingPayment'
        );

        DECLARE @NewBookingID INT = SCOPE_IDENTITY();

        INSERT INTO BookingDetails (
          BookingID, SlotID, CourtID, CoachID, CoachScheduleID,
          BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal
        )
        VALUES (
          @NewBookingID, @SlotID, @CourtID, NULL, NULL,
          @BookingDate, CAST(@StartTime AS TIME), CAST(@EndTime AS TIME),
          @CourtFee, 0, @CourtFee
        );

        -- BR-25: Hold slot 10 phut
        UPDATE CourtSlots
        SET Status = 'Holding',
            HoldUntil = DATEADD(MINUTE, 10, GETDATE()),
            UpdatedAt = GETDATE()
        WHERE SlotID = @SlotID;

        SELECT
          b.BookingID, b.BookingCode, b.UserID, b.BookingType, b.BookingDate,
          b.CourtFee, b.CoachFee, b.DiscountAmount, b.TotalAmount, b.Status, b.CreatedAt,
          bd.BookingDetailID, bd.SlotID, bd.CourtID, bd.CoachID, bd.CoachScheduleID,
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

export async function repoCreateCoachBooking(data: {
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
          BookingCode, UserID, BookingType, BookingDate,
          CourtFee, CoachFee, DiscountAmount, TotalAmount, Status
        )
        VALUES (
          @BookingCode, @UserID, @BookingType, @BookingDate,
          @CourtFee, @CoachFee, @DiscountAmount, @TotalAmount, 'PendingPayment'
        );

        DECLARE @NewBookingID INT = SCOPE_IDENTITY();

        INSERT INTO BookingDetails (
          BookingID, SlotID, CourtID, CoachID, CoachScheduleID,
          BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal
        )
        VALUES (
          @NewBookingID, NULL, NULL, @CoachID, @CoachScheduleID,
          @BookingDate, CAST(@StartTime AS TIME), CAST(@EndTime AS TIME),
          0, @CoachFee, @CoachFee
        );

        -- BR-25: Hold schedule 10 phut
        UPDATE CoachSchedules
        SET Status = 'Holding',
            HoldUntil = DATEADD(MINUTE, 10, GETDATE()),
            UpdatedAt = GETDATE()
        WHERE CoachScheduleID = @CoachScheduleID;

        SELECT
          b.BookingID, b.BookingCode, b.UserID, b.BookingType, b.BookingDate,
          b.CourtFee, b.CoachFee, b.DiscountAmount, b.TotalAmount, b.Status, b.CreatedAt,
          bd.BookingDetailID, bd.SlotID, bd.CourtID, bd.CoachID, bd.CoachScheduleID,
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

export async function repoCreateComboBooking(input: {
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
}): Promise<CreatedBooking> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  const totalAmount = input.courtFee + input.coachFee;
  const bookingCode = `CB-${Date.now()}`;

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    const result = await new sql.Request(transaction)
      .input("BookingCode", sql.VarChar(50), bookingCode)
      .input("UserID", sql.Int, input.userId)
      .input("BookingType", sql.VarChar(20), "Combo")
      .input("BookingDate", sql.Date, input.bookingDate)
      .input("CourtFee", sql.Decimal(18, 2), input.courtFee)
      .input("CoachFee", sql.Decimal(18, 2), input.coachFee)
      .input("DiscountAmount", sql.Decimal(18, 2), 0)
      .input("TotalAmount", sql.Decimal(18, 2), totalAmount)
      .input("SlotID", sql.Int, input.slotId)
      .input("CourtID", sql.Int, input.courtId)
      .input("CoachID", sql.Int, input.coachId)
      .input("CoachScheduleID", sql.Int, input.coachScheduleId)
      .input("StartTime", sql.VarChar(20), input.startTime)
      .input("EndTime", sql.VarChar(20), input.endTime)
      .input("SubTotal", sql.Decimal(18, 2), totalAmount)
      .query(`
        -- Lock ca slot va schedule (BR-28 atomic)
        IF NOT EXISTS (
          SELECT 1 FROM CourtSlots WITH (UPDLOCK, HOLDLOCK)
          WHERE SlotID = @SlotID AND Status = 'Available'
        )
        BEGIN
          THROW 50001, 'Court slot is not available', 1;
        END;

        IF NOT EXISTS (
          SELECT 1 FROM CoachSchedules WITH (UPDLOCK, HOLDLOCK)
          WHERE CoachScheduleID = @CoachScheduleID AND Status = 'Available'
        )
        BEGIN
          THROW 50002, 'Coach schedule is not available', 1;
        END;

        INSERT INTO Bookings (
          BookingCode, UserID, BookingType, BookingDate,
          CourtFee, CoachFee, DiscountAmount, TotalAmount, Status, CreatedAt
        )
        OUTPUT INSERTED.BookingID
        VALUES (
          @BookingCode, @UserID, @BookingType, @BookingDate,
          @CourtFee, @CoachFee, @DiscountAmount, @TotalAmount, 'PendingPayment', GETDATE()
        );

        DECLARE @NewBookingID INT = SCOPE_IDENTITY();

        INSERT INTO BookingDetails (
          BookingID, SlotID, CourtID, CoachID, CoachScheduleID,
          BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal
        )
        VALUES (
          @NewBookingID, @SlotID, @CourtID, @CoachID, @CoachScheduleID,
          @BookingDate, @StartTime, @EndTime, @CourtFee, @CoachFee, @SubTotal
        );

        -- BR-25: Hold ca slot va schedule 10 phut
        UPDATE CourtSlots
        SET Status = 'Holding', HoldUntil = DATEADD(MINUTE, 10, GETDATE()), UpdatedAt = GETDATE()
        WHERE SlotID = @SlotID;

        UPDATE CoachSchedules
        SET Status = 'Holding', HoldUntil = DATEADD(MINUTE, 10, GETDATE()), UpdatedAt = GETDATE()
        WHERE CoachScheduleID = @CoachScheduleID;

        SELECT
          b.BookingID, b.BookingCode, b.UserID, b.BookingType, b.BookingDate,
          b.CourtFee, b.CoachFee, b.DiscountAmount, b.TotalAmount, b.Status, b.CreatedAt,
          bd.BookingDetailID, bd.SlotID, bd.CourtID, bd.CoachID, bd.CoachScheduleID,
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

// ---- Cancel Booking ----

/**
 * Huy booking va release slot/schedule ve Available.
 * Thuc hien trong 1 transaction (BR-NEW-03).
 */
export async function repoCancelBookingById(
  bookingId: number,
  reason: string
): Promise<void> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input("BookingID", sql.Int, bookingId)
      .input("Reason", sql.NVarChar(255), reason)
      .query(`
        -- Cap nhat trang thai booking
        UPDATE Bookings
        SET Status = 'Cancelled',
            CancelledAt = GETDATE(),
            CancelReason = @Reason,
            UpdatedAt = GETDATE()
        WHERE BookingID = @BookingID;

        -- Release court slot ve Available (neu co)
        UPDATE CourtSlots
        SET Status = 'Available', HoldUntil = NULL, UpdatedAt = GETDATE()
        WHERE SlotID IN (
          SELECT SlotID FROM BookingDetails WHERE BookingID = @BookingID AND SlotID IS NOT NULL
        );

        -- Release coach schedule ve Available (neu co)
        UPDATE CoachSchedules
        SET Status = 'Available', HoldUntil = NULL, UpdatedAt = GETDATE()
        WHERE CoachScheduleID IN (
          SELECT CoachScheduleID FROM BookingDetails WHERE BookingID = @BookingID AND CoachScheduleID IS NOT NULL
        );
      `);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ---- Check-in ----

/**
 * Check-in booking: Confirmed → CheckedIn.
 * Goi sau khi da validate thoi gian o service.
 */
export async function repoCheckInBookingById(bookingId: number): Promise<void> {
  const pool = await getPool();

  await pool
    .request()
    .input("BookingID", sql.Int, bookingId)
    .query(`
      UPDATE Bookings
      SET Status = 'CheckedIn',
          CheckInTime = GETDATE(),
          UpdatedAt = GETDATE()
      WHERE BookingID = @BookingID
        AND Status = 'Confirmed'
    `);
}

// ---- Mock Pay ----

/**
 * Mock payment: mark booking Paid → Confirmed, tao Payment record.
 * Dev sau thay bang VNPay/Momo webhook.
 */
export async function repoMockPayBooking(
  bookingId: number,
  paymentMethod: "VNPay" | "Momo" = "VNPay"
): Promise<void> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input("BookingID", sql.Int, bookingId)
      .input("PaymentMethod", sql.NVarChar(50), paymentMethod)
      .input("TransactionCode", sql.NVarChar(100), `MOCK-${Date.now()}`)
      .query(`
        DECLARE @TotalAmount DECIMAL(18,2);
        SELECT @TotalAmount = TotalAmount FROM Bookings WHERE BookingID = @BookingID;

        INSERT INTO Payments (BookingID, PaymentMethod, Amount, TransactionCode, Status, PaidAt, CreatedAt)
        VALUES (@BookingID, @PaymentMethod, @TotalAmount, @TransactionCode, 'Paid', GETDATE(), GETDATE());

        UPDATE Bookings
        SET Status = 'Confirmed', UpdatedAt = GETDATE()
        WHERE BookingID = @BookingID AND Status = 'PendingPayment';

        -- Mark slot/schedule la Booked (khong con la Holding)
        UPDATE CourtSlots
        SET Status = 'Booked', HoldUntil = NULL, UpdatedAt = GETDATE()
        WHERE SlotID IN (
          SELECT SlotID FROM BookingDetails WHERE BookingID = @BookingID AND SlotID IS NOT NULL
        );

        UPDATE CoachSchedules
        SET Status = 'Booked', HoldUntil = NULL, UpdatedAt = GETDATE()
        WHERE CoachScheduleID IN (
          SELECT CoachScheduleID FROM BookingDetails WHERE BookingID = @BookingID AND CoachScheduleID IS NOT NULL
        );
      `);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ---- Release Expired (BR-26 + BR-31 + BR-32) ----

/**
 * BR-26: Cancel cac booking PendingPayment qua HoldUntil (10 phut).
 * Release slot va schedule ve Available.
 */
export async function repoReleaseExpiredHoldings(): Promise<number> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const result = await new sql.Request(transaction).query(`
      -- Lay danh sach booking het han
      DECLARE @ExpiredIDs TABLE (BookingID INT);

      INSERT INTO @ExpiredIDs
      SELECT b.BookingID
      FROM Bookings b
      WHERE b.Status = 'PendingPayment'
        AND EXISTS (
          SELECT 1 FROM CourtSlots cs
          JOIN BookingDetails bd ON bd.SlotID = cs.SlotID
          WHERE bd.BookingID = b.BookingID
            AND cs.HoldUntil < GETDATE()
          UNION ALL
          SELECT 1 FROM CoachSchedules sch
          JOIN BookingDetails bd ON bd.CoachScheduleID = sch.CoachScheduleID
          WHERE bd.BookingID = b.BookingID
            AND sch.HoldUntil < GETDATE()
        );

      -- Cancel cac booking het han
      UPDATE Bookings
      SET Status = 'Cancelled',
          CancelledAt = GETDATE(),
          CancelReason = N'Tu dong huy: het thoi gian giu cho (10 phut) - BR-26',
          UpdatedAt = GETDATE()
      WHERE BookingID IN (SELECT BookingID FROM @ExpiredIDs);

      -- Release court slots
      UPDATE CourtSlots
      SET Status = 'Available', HoldUntil = NULL, UpdatedAt = GETDATE()
      WHERE SlotID IN (
        SELECT SlotID FROM BookingDetails
        WHERE BookingID IN (SELECT BookingID FROM @ExpiredIDs)
          AND SlotID IS NOT NULL
      );

      -- Release coach schedules
      UPDATE CoachSchedules
      SET Status = 'Available', HoldUntil = NULL, UpdatedAt = GETDATE()
      WHERE CoachScheduleID IN (
        SELECT CoachScheduleID FROM BookingDetails
        WHERE BookingID IN (SELECT BookingID FROM @ExpiredIDs)
          AND CoachScheduleID IS NOT NULL
      );

      SELECT COUNT(*) AS ReleasedCount FROM @ExpiredIDs;
    `);

    await transaction.commit();
    return result.recordset[0]?.ReleasedCount ?? 0;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * BR-31: Mark cac booking Confirmed qua 15 phut sau gio bat dau ma chua check-in → No-show.
 */
export async function repoMarkNoShowExpired(): Promise<number> {
  const pool = await getPool();

  const result = await pool.request().query(`
    DECLARE @NoShowIDs TABLE (BookingID INT);

    INSERT INTO @NoShowIDs
    SELECT b.BookingID
    FROM Bookings b
    JOIN BookingDetails bd ON bd.BookingID = b.BookingID
    WHERE b.Status = 'Confirmed'
      AND b.CheckInTime IS NULL
      -- Qua 15 phut sau gio bat dau (BR-31)
      AND CAST(CONCAT(CAST(b.BookingDate AS VARCHAR), ' ', CONVERT(VARCHAR(5), bd.StartTime, 108)) AS DATETIME)
            < DATEADD(MINUTE, -15, GETDATE());

    UPDATE Bookings
    SET Status = 'NoShow',
        UpdatedAt = GETDATE()
    WHERE BookingID IN (SELECT BookingID FROM @NoShowIDs);

    SELECT COUNT(*) AS NoShowCount FROM @NoShowIDs;
  `);

  return result.recordset[0]?.NoShowCount ?? 0;
}

/**
 * BR-32: Chuyen booking tu CheckedIn sang Completed.
 * Dieu kien: da check-in (CheckInTime IS NOT NULL) VA EndTime + 30 phut da qua.
 */
export async function repoMarkCompletedExpiredCheckins(): Promise<number> {
  const pool = await getPool();

  const result = await pool.request().query(`
    DECLARE @CompleteIDs TABLE (BookingID INT);

    INSERT INTO @CompleteIDs
    SELECT b.BookingID
    FROM Bookings b
    JOIN BookingDetails bd ON bd.BookingID = b.BookingID
    WHERE b.Status = 'CheckedIn'
      AND b.CheckInTime IS NOT NULL
      -- EndTime + 30 phut da qua (BR-32)
      AND CAST(CONCAT(CAST(b.BookingDate AS VARCHAR), ' ', CONVERT(VARCHAR(5), bd.EndTime, 108)) AS DATETIME)
            < DATEADD(MINUTE, -30, GETDATE());

    UPDATE Bookings
    SET Status = 'Completed',
        UpdatedAt = GETDATE()
    WHERE BookingID IN (SELECT BookingID FROM @CompleteIDs);

    -- Mark slot/schedule ve Available sau khi hoan thanh
    UPDATE CourtSlots
    SET Status = 'Available', HoldUntil = NULL, UpdatedAt = GETDATE()
    WHERE SlotID IN (
      SELECT SlotID FROM BookingDetails
      WHERE BookingID IN (SELECT BookingID FROM @CompleteIDs)
        AND SlotID IS NOT NULL
    );

    UPDATE CoachSchedules
    SET Status = 'Available', HoldUntil = NULL, UpdatedAt = GETDATE()
    WHERE CoachScheduleID IN (
      SELECT CoachScheduleID FROM BookingDetails
      WHERE BookingID IN (SELECT BookingID FROM @CompleteIDs)
        AND CoachScheduleID IS NOT NULL
    );

    SELECT COUNT(*) AS CompletedCount FROM @CompleteIDs;
  `);

  return result.recordset[0]?.CompletedCount ?? 0;
}

// ---- View Bookings ----

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

export async function findBookingsByCoachUserId(userId: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT
        b.BookingID,
        b.BookingCode,
        b.UserID AS PlayerID,
        pu.FullName AS PlayerName,
        pu.AvatarURL AS PlayerAvatar,
        b.BookingType,
        b.BookingDate,
        b.CoachFee,
        b.TotalAmount,
        b.Status,
        b.CheckInTime,
        b.CancelledAt,
        b.CancelReason,
        b.CreatedAt,

        bd.BookingDetailID,
        bd.CourtID,
        c.CourtName,
        c.Location,

        bd.CoachScheduleID,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,

        p.PaymentMethod,
        p.Status AS PaymentStatus,
        p.PaidAt
      FROM Bookings b
      JOIN Users pu ON pu.UserID = b.UserID
      JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      JOIN Coaches co ON bd.CoachID = co.CoachID
      LEFT JOIN Courts c ON bd.CourtID = c.CourtID
      LEFT JOIN Payments p ON p.BookingID = b.BookingID
      WHERE co.UserID = @UserID
      ORDER BY b.BookingDate DESC, bd.StartTime DESC
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

/**
 * UC-49: Staff xem booking trong ngay.
 * Co the loc theo ngay cu the (mac dinh la hom nay).
 */
export async function findDailyBookingsForStaff(
  date?: string
): Promise<DailyBooking[]> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("TargetDate", sql.Date, date ?? new Date().toISOString().split("T")[0])
    .query(`
      SELECT
        b.BookingID,
        b.BookingCode,
        b.BookingType,
        b.BookingDate,
        CONVERT(VARCHAR(5), bd.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), bd.EndTime, 108) AS EndTime,
        b.TotalAmount,
        b.Status,
        b.CheckInTime,

        u.FullName AS PlayerName,
        u.Email AS PlayerEmail,
        u.PhoneNumber AS PlayerPhone,

        c.CourtName,
        cu.FullName AS CoachName,

        p.PaymentMethod,
        p.Status AS PaymentStatus
      FROM Bookings b
      JOIN Users u ON u.UserID = b.UserID
      LEFT JOIN BookingDetails bd ON bd.BookingID = b.BookingID
      LEFT JOIN Courts c ON bd.CourtID = c.CourtID
      LEFT JOIN Coaches co ON bd.CoachID = co.CoachID
      LEFT JOIN Users cu ON co.UserID = cu.UserID
      LEFT JOIN Payments p ON p.BookingID = b.BookingID
      WHERE b.BookingDate = @TargetDate
      ORDER BY bd.StartTime ASC, b.CreatedAt ASC
    `);

  return result.recordset;
}

// ---- Team Booking (UC-36) ----

/**
 * UC-36: Tao Team Booking sau khi nhom duoc ghep thanh cong.
 * BookingCode prefix 'TM-' de phan biet voi booking thuong.
 */
export async function repoCreateTeamBooking(data: {
  userId: number;
  groupId: number;
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
    const bookingCode = `TM-${Date.now()}`;
    const groupNote = `[TeamBooking][GroupID:${data.groupId}]`;

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
      .input("GroupNote", sql.NVarChar(200), groupNote)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM CourtSlots WITH (UPDLOCK, HOLDLOCK)
          WHERE SlotID = @SlotID AND Status = 'Available'
        )
        BEGIN
          THROW 50001, 'Court slot is not available', 1;
        END;

        INSERT INTO Bookings (
          BookingCode, UserID, BookingType, BookingDate,
          CourtFee, CoachFee, DiscountAmount, TotalAmount, Status, CancelReason
        )
        OUTPUT INSERTED.*
        VALUES (
          @BookingCode, @UserID, @BookingType, @BookingDate,
          @CourtFee, @CoachFee, @DiscountAmount, @TotalAmount, 'PendingPayment',
          @GroupNote
        );

        DECLARE @NewBookingID INT = SCOPE_IDENTITY();

        INSERT INTO BookingDetails (
          BookingID, SlotID, CourtID, CoachID, CoachScheduleID,
          BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal
        )
        VALUES (
          @NewBookingID, @SlotID, @CourtID, NULL, NULL,
          @BookingDate, CAST(@StartTime AS TIME), CAST(@EndTime AS TIME),
          @CourtFee, 0, @CourtFee
        );

        UPDATE CourtSlots
        SET Status = 'Holding',
            HoldUntil = DATEADD(MINUTE, 10, GETDATE()),
            UpdatedAt = GETDATE()
        WHERE SlotID = @SlotID;

        SELECT
          b.BookingID, b.BookingCode, b.UserID, b.BookingType, b.BookingDate,
          b.CourtFee, b.CoachFee, b.DiscountAmount, b.TotalAmount, b.Status, b.CreatedAt,
          bd.BookingDetailID, bd.SlotID, bd.CourtID, bd.CoachID, bd.CoachScheduleID,
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

// ============================================================
// SERVICE
// ============================================================

// ---- Helper Functions ----

/**
 * Tinh so gio giua startTime va endTime.
 * Validate: toi thieu 1 gio, toi da 4 gio.
 */
function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const diffMinutes = end - start;

  if (diffMinutes <= 0) {
    throw new Error("End time phai lon hon start time");
  }

  const hours = diffMinutes / 60;

  if (hours < 1) {
    throw new Error("Thoi gian dat san toi thieu la 1 gio");
  }

  if (hours > 4) {
    throw new Error("Thoi gian dat san toi da la 4 gio");
  }

  return hours;
}

/**
 * Validate ngay dat phai >= hom nay, va thoi gian chua troi qua (BR-23).
 */
function validateBookingDate(bookingDate: string, startTime: string): void {
  const nowVN = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );

  // Format YYYY-MM-DD
  const year = nowVN.getFullYear();
  const month = String(nowVN.getMonth() + 1).padStart(2, "0");
  const day = String(nowVN.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  if (bookingDate < todayStr) {
    throw new Error("Ngay dat phai la hom nay hoac trong tuong lai (BR-23)");
  }

  if (bookingDate === todayStr) {
    const currentHour = nowVN.getHours();
    const currentMinute = nowVN.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;

    if (startTotalMinutes <= currentTotalMinutes) {
      throw new Error("Khung gio nay da troi qua so voi thoi gian hien tai, khong the dat nua.");
    }
  }
}

/**
 * Kiem tra user chua qua 3 booking Holding (BR-40).
 */
async function validateHoldingLimit(userId: number): Promise<void> {
  const holdingCount = await countHoldingBookingsByUserId(userId);
  if (holdingCount >= 3) {
    throw new Error(
      "Ban dang co 3 booking cho thanh toan. Vui long thanh toan hoac huy truoc khi dat them (BR-40)"
    );
  }
}

/**
 * Validate coach fee trong khoang [150,000 - 2,000,000] VND/gio (BR-42/43).
 */
function validateCoachFeePerHour(hourlyRate: number): void {
  if (hourlyRate < 150000) {
    throw new Error("Coach fee toi thieu la 150,000 VND/gio (BR-42)");
  }
  if (hourlyRate > 2000000) {
    throw new Error("Coach fee toi da la 2,000,000 VND/gio (BR-43)");
  }
}

// ---- Create Bookings ----

/**
 * UC-13: Dat san Court.
 * BR-22: requireAuth (xu ly o controller).
 * BR-23: validateBookingDate.
 * BR-40: max 3 Holding.
 * BR-25/27/28: xu ly trong repository (transaction SERIALIZABLE, HoldUntil).
 */
export async function createCourtBooking(input: CreateCourtBookingInput) {
  // BR-23 + Real-time check
  validateBookingDate(input.bookingDate, input.startTime);

  // BR-22 (userId da duoc lay tu JWT o controller)
  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  // BR-40
  await validateHoldingLimit(input.userId);

  const court = await findCourtByIdForBooking(input.courtId);
  if (!court) throw new Error("San khong ton tai");
  if (court.Status !== "Available") throw new Error("San hien khong kha dung");

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;

  // BR-24/27: tim slot kha dung
  const slot = await findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!slot) throw new Error("Khung gio nay da bi dat hoac khong co slot phu hop");

  // BR-39: Khong cho dat vao slot da Cancelled (xu ly bang Status check o DB)
  return repoCreateCourtBooking({
    userId: input.userId,
    courtId: input.courtId,
    slotId: slot.SlotID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
  });
}

/**
 * UC-13 mo rong: Dat Coach.
 * BR-41: Coach phai Approved.
 * BR-42/43: Coach fee trong khoang hop le.
 * BR-44/46: xu ly trong repository (Available + buffer 15 phut).
 */
export async function createCoachBooking(input: CreateCoachBookingInput) {
  validateBookingDate(input.bookingDate, input.startTime);

  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  await validateHoldingLimit(input.userId);

  const coach = await findCoachByIdForBooking(input.coachId);
  if (!coach) throw new Error("HLV khong ton tai");
  if (coach.Status !== "Approved") throw new Error("HLV chua duoc duyet (BR-41)");

  // BR-42/43
  validateCoachFeePerHour(Number(coach.HourlyRate));

  const hours = calculateHours(input.startTime, input.endTime);
  const coachFee = Number(coach.HourlyRate) * hours;

  // BR-44/46: findAvailableCoachSchedule da kiem tra buffer 15 phut
  const coachSchedule = await findAvailableCoachSchedule(
    input.coachId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!coachSchedule) {
    throw new Error("HLV khong co lich trong khung gio nay hoac vi pham buffer 15 phut (BR-46)");
  }

  return repoCreateCoachBooking({
    userId: input.userId,
    coachId: input.coachId,
    coachScheduleId: coachSchedule.CoachScheduleID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    coachFee,
  });
}

/**
 * UC-15: Dat Combo (San + HLV cung giao dich - BR-28 atomic).
 */
export async function createComboBooking(input: CreateComboBookingInput) {
  validateBookingDate(input.bookingDate, input.startTime);

  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  await validateHoldingLimit(input.userId);

  const court = await findCourtByIdForBooking(input.courtId);
  if (!court) throw new Error("San khong ton tai");
  if (court.Status !== "Available") throw new Error("San hien khong kha dung");

  const coach = await findCoachByIdForBooking(input.coachId);
  if (!coach) throw new Error("HLV khong ton tai");
  if (coach.Status !== "Approved") throw new Error("HLV chua duoc duyet (BR-41)");

  // BR-42/43
  validateCoachFeePerHour(Number(coach.HourlyRate));

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;
  const coachFee = Number(coach.HourlyRate) * hours;

  const slot = await findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!slot) throw new Error("Khung gio san da bi dat");

  // BR-46
  const coachSchedule = await findAvailableCoachSchedule(
    input.coachId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!coachSchedule) {
    throw new Error("HLV khong co lich trong khung gio nay hoac vi pham buffer 15 phut (BR-46)");
  }

  return repoCreateComboBooking({
    userId: input.userId,
    courtId: input.courtId,
    coachId: input.coachId,
    slotId: slot.SlotID,
    coachScheduleId: coachSchedule.CoachScheduleID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
    coachFee,
  });
}

// ---- Cancel Booking (UC-17) ----

/**
 * UC-17: Huy booking.
 * BR-NEW-01: Chi cancel khi Status = PendingPayment hoac Confirmed.
 * BR-NEW-02: Chi chu booking hoac Admin/Staff duoc cancel.
 * BR-33: Huy >= 12 gio truoc → refund 100%.
 * BR-34: Huy < 12 gio va >= 2 gio → refund 70%.
 * BR-35: Huy < 2 gio → khong refund.
 * BR-NEW-03: Release slot/schedule ve Available.
 */
export async function cancelBooking(
  input: CancelBookingInput
): Promise<CancelBookingResult> {
  const booking = await findBookingWithPaymentById(input.bookingId);

  if (!booking) {
    throw new Error("Booking khong ton tai");
  }

  // BR-NEW-02: Kiem tra quyen cancel
  const isOwner = booking.UserID === input.userId;
  const isAdminOrStaff = input.userRoles.some((r) =>
    ["Admin", "Staff"].includes(r)
  );
  if (!isOwner && !isAdminOrStaff) {
    throw new Error("Ban khong co quyen huy booking nay (BR-NEW-02)");
  }

  // BR-NEW-01: Chi cancel khi dang PendingPayment hoac Confirmed
  if (!["PendingPayment", "Confirmed"].includes(booking.Status)) {
    throw new Error(
      `Khong the huy booking co trang thai ${booking.Status}. Chi huy duoc khi dang cho thanh toan hoac da xac nhan (BR-NEW-01)`
    );
  }

  // Tinh thoi gian den khi bat dau choi
  const bookingStartDateTime = new Date(
    `${booking.BookingDate.toString().split("T")[0]}T${booking.StartTime}:00`
  );
  const now = new Date();
  const hoursUntilStart = (bookingStartDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Tinh refund
  let refundPercent = 0;
  let refundNote = "";

  if (hoursUntilStart >= 12) {
    // BR-33: Huy truoc 12 gio → refund 100%
    refundPercent = 100;
    refundNote = "Huy truoc 12 gio - hoan 100% (BR-33)";
  } else if (hoursUntilStart >= 2) {
    // BR-34: Huy trong 2-12 gio → refund 70%
    refundPercent = 70;
    refundNote = "Huy trong 2-12 gio - hoan 70%, tru 30% phi (BR-34)";
  } else {
    // BR-35: Huy trong 2 gio → khong refund
    refundPercent = 0;
    refundNote = "Huy trong vong 2 gio - khong duoc hoan tien (BR-35)";
  }

  const totalAmount = Number(booking.TotalAmount);
  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  const cancelReason = input.cancelReason ?? `Huy boi nguoi dung. ${refundNote}`;

  // BR-NEW-03: Cancel va release slot/schedule trong transaction
  await repoCancelBookingById(input.bookingId, cancelReason);

  // BR-36: Tao refund record (se xu ly trong 7 ngay lam viec - BR-37)
  const refundRecord = await requestRefund(
    input.bookingId,
    refundAmount,
    refundNote
  );

  // Gui notification cho user (BR-54 phan Player)
  void createNotification({
    userId: input.userId,
    title: "Booking da bi huy",
    message: `Booking #${booking.BookingCode} da bi huy. ${refundNote}`,
    notificationType: "Booking",
  });

  return {
    bookingId: input.bookingId,
    status: "Cancelled",
    refundAmount,
    refundPercent,
    refundNote,
    refundRecord,
  };
}

/**
 * BR-54: Coach chu dong huy booking Confirmed.
 * Player duoc hoan 100% trong 24 gio, gui notification ngay.
 */
export async function cancelBookingByCoach(
  bookingId: number,
  coachUserId: number
): Promise<CancelBookingResult> {
  const booking = await findBookingWithPaymentById(bookingId);

  if (!booking) throw new Error("Booking khong ton tai");
  if (booking.Status !== "Confirmed") {
    throw new Error("Chi co the huy booking o trang thai Confirmed (BR-54)");
  }

  const cancelReason =
    "HLV chu dong huy - hoan 100% trong 24 gio (BR-54)";

  await repoCancelBookingById(bookingId, cancelReason);

  const totalAmount = Number(booking.TotalAmount);

  // BR-54: Hoan 100%
  const refundRecord = await requestRefund(bookingId, totalAmount, cancelReason);

  // BR-54: Gui notification cho Player ngay lap tuc
  void createNotification({
    userId: booking.UserID,
    title: "HLV da huy lich day",
    message: `HLV da huy lich day cho booking #${booking.BookingCode}. Ban se duoc hoan 100% so tien (${totalAmount.toLocaleString("vi-VN")} VND) trong 24 gio.`,
    notificationType: "Booking",
  });

  // Gui notification cho coach
  void createNotification({
    userId: coachUserId,
    title: "Ban da huy lich day",
    message: `Ban da huy booking #${booking.BookingCode}. He thong se hoan 100% cho Player.`,
    notificationType: "Booking",
  });

  return {
    bookingId,
    status: "Cancelled",
    refundAmount: totalAmount,
    refundPercent: 100,
    refundNote: cancelReason,
    refundRecord,
  };
}

// ---- Check-in (BR-29/30) ----

/**
 * BR-29: Chi check-in khi booking da Confirmed.
 * BR-30: Thoi gian check-in hop le: tu 30 phut truoc den 15 phut sau gio bat dau.
 */
export async function checkInBooking(
  input: CheckInInput
): Promise<CheckInResult> {
  const booking = await findBookingById(input.bookingId);

  if (!booking) throw new Error("Booking khong ton tai");

  // Kiem tra ownership (Bo qua neu la Admin hoac Staff)
  const isAdminOrStaff = input.userRoles?.some((r) => ["Admin", "Staff"].includes(r));
  if (!isAdminOrStaff && booking.UserID !== input.userId) {
    throw new Error("Ban khong co quyen check-in booking nay");
  }

  // BR-29
  if (booking.Status !== "Confirmed") {
    throw new Error(
      `Chi check-in duoc khi booking o trang thai Confirmed (hien tai: ${booking.Status}) (BR-29)`
    );
  }

  // Lay gio hien tai o Viet Nam
  const nowVN = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );

  const vnDateStr = new Date(booking.BookingDate).toLocaleDateString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [month, day, year] = vnDateStr.split("/");
  const dateStr = `${year}-${month}-${day}`;

  const bookingStartDateTime = new Date(`${dateStr}T${booking.StartTime}:00`);
  const bookingEndDateTime = new Date(`${dateStr}T${booking.EndTime}:00`);

  // Duoc phep check-in truoc 30 phut
  if (nowVN.getTime() < bookingStartDateTime.getTime() - 30 * 60 * 1000) {
    throw new Error("Chưa đến thời gian check-in. Bạn chỉ có thể check-in sớm nhất trước 30 phút.");
  }

  // KHONG duoc check-in sau khi gio choi da ket thuc
  if (nowVN.getTime() > bookingEndDateTime.getTime()) {
    throw new Error("Đã quá thời gian check-in. Chỉ có thể check-in trong khoảng thời gian đặt sân.");
  }

  await repoCheckInBookingById(input.bookingId);

  const checkInTime = new Date().toISOString();

  // Gui notification
  void createNotification({
    userId: input.userId,
    title: "Check-in thanh cong",
    message: `Ban da check-in thanh cong cho booking #${booking.BookingCode}. Chuc ban choi vui ve!`,
    notificationType: "Booking",
  });

  return {
    bookingId: input.bookingId,
    status: "CheckedIn",
    checkInTime,
  };
}

// ---- Mock Pay ----

/**
 * Mock thanh toan: PendingPayment → Confirmed.
 * Dev sau thay bang VNPay/Momo webhook.
 */
export async function mockPayBooking(
  bookingId: number,
  userId: number,
  paymentMethod: "VNPay" | "Momo" = "VNPay"
) {
  const booking = await findBookingById(bookingId);

  if (!booking) throw new Error("Booking khong ton tai");
  if (booking.UserID !== userId) throw new Error("Ban khong co quyen thanh toan booking nay");
  if (booking.Status !== "PendingPayment") {
    throw new Error(`Booking o trang thai ${booking.Status}, khong the thanh toan`);
  }

  await repoMockPayBooking(bookingId, paymentMethod);

  // Gui notification
  void createNotification({
    userId,
    title: "Thanh toan thanh cong",
    message: `Booking #${booking.BookingCode} da duoc thanh toan thanh cong qua ${paymentMethod}. Chuc ban choi vui ve!`,
    notificationType: "Payment",
  });

  return {
    bookingId,
    bookingCode: booking.BookingCode,
    status: "Confirmed",
    paymentMethod,
    message: "Thanh toan thanh cong. Booking da duoc xac nhan.",
  };
}

// ---- Release Expired (BR-26/31/32) ----

/**
 * BR-26 + BR-31: Giai phong cac booking het han va mark no-show.
 */
export async function releaseExpiredBookings() {
  const [releasedCount, noShowCount] = await Promise.all([
    repoReleaseExpiredHoldings(),  // BR-26
    repoMarkNoShowExpired(),        // BR-31
  ]);

  return {
    releasedHoldings: releasedCount,
    markedNoShow: noShowCount,
    message: `Da giai phong ${releasedCount} booking Holding het han, danh dau ${noShowCount} booking No-show`,
  };
}

/**
 * BR-32: Tu dong chuyen booking tu CheckedIn sang Completed.
 * Dieu kien: booking da check-in VA da het gio choi (EndTime + 30 phut).
 */
export async function completeCheckedInBookings() {
  const completedCount = await repoMarkCompletedExpiredCheckins();

  return {
    completedCount,
    message: `Da hoan thanh ${completedCount} booking CheckedIn het gio choi (BR-32)`,
  };
}

// ---- View Bookings ----

export async function getMyBookings(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  return findBookingsByUserId(userId);
}

export async function getCoachReceivedBookings(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  return findBookingsByCoachUserId(userId);
}

export async function getBookingDetail(bookingId: number, userId: number, userRoles: string[]) {
  const booking = await findBookingById(bookingId);
  if (!booking) throw new Error("Booking khong ton tai");

  // Chi chu booking hoac Admin/Staff moi xem duoc chi tiet
  const isOwner = booking.UserID === userId;
  const isAdminOrStaff = userRoles.some((r) => ["Admin", "Staff"].includes(r));

  if (!isOwner && !isAdminOrStaff) {
    throw new Error("Ban khong co quyen xem booking nay");
  }

  return booking;
}

/**
 * UC-49: Staff xem booking trong ngay.
 * BR-NEW-04: Chi Staff/Admin moi duoc goi (xu ly o controller).
 */
export async function getDailyBookings(date?: string) {
  return findDailyBookingsForStaff(date);
}

// ---- Team Booking (UC-36) ----

/**
 * UC-36: Dat san sau khi ghep nhom thanh cong.
 *
 * BR dependencies:
 * - BR-23: Ngay dat >= hom nay
 * - BR-28: Transaction locking chong double booking
 * - BR-40: Max 3 Holding cung luc (ap dung cho tat ca thanh vien nhom)
 * - BR-91: Nhom toi da 4 nguoi (validate tu PlayGroups module)
 * - BR-92: Player max 3 nhom active (validate tu PlayGroups module)
 *
 * TODO: Implement day du sau khi PlayGroups & PlayerMatching module hoan thanh.
 *       Can goi: playgroupsService.validateGroupForBooking(groupId)
 *                matchingService.validateMatchStatus(matchId)
 */
export async function createTeamBooking(input: {
  userId: number;      // Nguoi dat (leader of group)
  groupId: number;     // PlayGroup ID sau khi match thanh cong
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
}) {
  // BR-23
  validateBookingDate(input.bookingDate, input.startTime);

  // Validate user
  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  // BR-40
  await validateHoldingLimit(input.userId);

  // Validate court
  const court = await findCourtByIdForBooking(input.courtId);
  if (!court) throw new Error("San khong ton tai");
  if (court.Status !== "Available") throw new Error("San hien khong kha dung");

  // ===================================================
  // TODO: Validate PlayGroup status (cho module Matching)
  // Uncomment khi PlayGroups module da implement:
  //
  // const group = await playgroupsRepo.findGroupById(input.groupId);
  // if (!group) throw new Error("Nhom choi khong ton tai (UC-36)");
  // if (group.Status !== 'Matched') {
  //   throw new Error("Nhom chua duoc ghep thanh cong, khong the dat san (UC-36)");
  // }
  // if (group.LeaderID !== input.userId) {
  //   throw new Error("Chi leader nhom moi co quyen dat san cho ca nhom (UC-36)");
  // }
  // ===================================================

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;

  const slot = await findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!slot) throw new Error("Khung gio san da bi dat hoac khong co slot phu hop");

  // Tao booking voi type = 'Team' va ghi nhan groupId
  return repoCreateTeamBooking({
    userId: input.userId,
    groupId: input.groupId,
    courtId: input.courtId,
    slotId: slot.SlotID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
  });
}

// ============================================================
// CONTROLLER
// ============================================================

// ---- Create Bookings ----

/**
 * UC-13: Tao booking san.
 * UserID lay tu JWT, khong lay tu body (BR-22/BR-NEW-02).
 */
export async function createCourtBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await createCourtBooking({
      userId: auth.userId,
      courtId: Number(body.courtId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat san thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Tao booking Coach.
 */
export async function createCoachBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await createCoachBooking({
      userId: auth.userId,
      coachId: Number(body.coachId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat HLV thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * UC-15: Tao combo booking (san + HLV).
 */
export async function createComboBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await createComboBooking({
      userId: auth.userId,
      courtId: Number(body.courtId),
      coachId: Number(body.coachId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat combo san + HLV thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

// ---- Cancel Booking (UC-17) ----

/**
 * UC-17: Huy booking.
 * bookingId lay tu URL params (/api/bookings/:bookingId/cancel).
 */
export async function cancelBookingController(
  req: NextRequest,
  bookingId: number
) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));

    const result = await cancelBooking({
      bookingId,
      userId: auth.userId,
      userRoles: auth.roles,
      cancelReason: body.cancelReason,
    });

    return successResponse(result, "Huy booking thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * BR-54: Coach chu dong huy booking Confirmed.
 */
export async function cancelBookingByCoachController(
  req: NextRequest,
  bookingId: number
) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    // Chi Coach moi duoc goi endpoint nay
    const roleCheck = requireRoles(auth, ["Coach", "Admin"]);
    if (roleCheck) return roleCheck;

    const result = await cancelBookingByCoach(bookingId, auth.userId);

    return successResponse(result, "HLV da huy booking. Player se duoc hoan tien trong 24 gio.");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Check-in (BR-29/30) ----

/**
 * BR-29/30: Check-in booking.
 */
export async function checkInController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await checkInBooking({
      bookingId,
      userId: auth.userId,
      userRoles: auth.roles, // Pass roles for bypass ownership
    });

    return successResponse(result, "Check-in thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Mock Pay ----

/**
 * Mock payment: PendingPayment → Confirmed.
 * Dev sau thay bang VNPay/Momo webhook.
 */
export async function mockPayController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));
    const paymentMethod = body.paymentMethod === "Momo" ? "Momo" : "VNPay";

    const result = await mockPayBooking(bookingId, auth.userId, paymentMethod);

    return successResponse(result, "Thanh toan thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Release Expired (BR-26/31) ----

/**
 * BR-26/31: Giai phong booking het han va mark no-show.
 * BR-32: Tu dong chuyen CheckedIn -> Completed sau khi het gio choi.
 * Goi boi cron job hoac thu cong.
 */
export async function releaseExpiredController(_req: NextRequest) {
  try {
    const [releaseResult, completeResult] = await Promise.all([
      releaseExpiredBookings(),
      completeCheckedInBookings(),
    ]);

    return successResponse(
      { ...releaseResult, ...completeResult },
      `Kiem tra hoan tat: ${releaseResult.releasedHoldings} hold het han, ${releaseResult.markedNoShow} no-show, ${completeResult.completedCount} hoan thanh`
    );
  } catch (error) {
    return handleError(error);
  }
}

// ---- View Bookings ----

/**
 * UC-19: Lay lich su booking cua user dang dang nhap.
 */
export async function getMyBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await getMyBookings(auth.userId);
    return successResponse(result, "Lay lich su booking thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lay danh sach booking ma HLV nhan duoc.
 */
export async function getCoachReceivedBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Coach", "Admin"]);
    if (roleCheck) return roleCheck;

    const result = await getCoachReceivedBookings(auth.userId);
    return successResponse(result, "Lay danh sach don dat lich thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lay chi tiet booking (kiem tra quyen).
 */
export async function getBookingDetailController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(req.url);
    const bookingId = Number(searchParams.get("bookingId"));

    if (!bookingId) throw new Error("bookingId la bat buoc");

    const result = await getBookingDetail(bookingId, auth.userId, auth.roles);
    return successResponse(result, "Lay chi tiet booking thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * UC-49: Staff xem booking trong ngay.
 * BR-NEW-04: Chi Staff/Admin moi duoc xem.
 */
export async function getDailyBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Staff"]);
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;

    const result = await getDailyBookings(date);
    return successResponse(result, "Lay booking trong ngay thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Team Booking (UC-36) ----

/**
 * UC-36: Dat san cho nhom da duoc ghep (matched players).
 */
export async function createTeamBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    if (!body.groupId) {
      throw new Error("groupId la bat buoc cho Team Booking (UC-36)");
    }

    const result = await createTeamBooking({
      userId: auth.userId,
      groupId: Number(body.groupId),
      courtId: Number(body.courtId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat san cho nhom thanh cong (UC-36)", 201);
  } catch (error) {
    return handleError(error);
  }
}
