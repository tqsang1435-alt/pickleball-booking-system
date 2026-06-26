const sql = require("mssql");
require("dotenv").config();

const queryStr = `
-- Dùng Database cấu hình trong env
BEGIN TRANSACTION;
BEGIN TRY
    -- Khai báo các biến tạm
    DECLARE @NewBookingID INT;
    DECLARE @NewDetailID INT;
    DECLARE @NewPaymentID INT;

    -- ==========================================
    -- ĐƠN 1: Ngày 2026-06-20
    -- ==========================================
    -- UserID 2 (Tran Bao Chau) đặt HLV ID 5 (Nguyen Minh Khoa)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_COACH_20260620_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 2, 'Coach', '2026-06-20', 350000, 350000, 'Paid', '2026-06-20 07:45:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 5, '2026-06-20', '08:00:00', '09:00:00', 350000, 350000, '2026-06-20 07:45:00');
    SET @NewDetailID = SCOPE_IDENTITY();

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'PayOS', 350000, 'PAY_COACH_20260620_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_COACH_20260620_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-20 07:55:00', '2026-06-20 07:45:00');
    
    INSERT INTO CoachIncome (CoachID, BookingID, GrossAmount, CommissionRate, NetAmount, Status, CreatedAt, PaidAt)
    VALUES (5, @NewBookingID, 350000, 15.00, 297500, 'Paid', '2026-06-20 07:55:00', '2026-06-20 08:00:00');

    -- ==========================================
    -- ĐƠN 2: Ngày 2026-06-21
    -- ==========================================
    -- UserID 3 (Le Quoc Huy) đặt HLV ID 6 (Quynh Anh)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_COACH_20260621_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 3, 'Coach', '2026-06-21', 400000, 400000, 'Paid', '2026-06-21 13:30:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 6, '2026-06-21', '14:00:00', '15:00:00', 400000, 400000, '2026-06-21 13:30:00');
    SET @NewDetailID = SCOPE_IDENTITY();

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'Momo', 400000, 'PAY_COACH_20260621_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_COACH_20260621_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-21 13:40:00', '2026-06-21 13:30:00');

    INSERT INTO CoachIncome (CoachID, BookingID, GrossAmount, CommissionRate, NetAmount, Status, CreatedAt, PaidAt)
    VALUES (6, @NewBookingID, 400000, 15.00, 340000, 'Paid', '2026-06-21 13:40:00', '2026-06-21 14:00:00');

    -- ==========================================
    -- ĐƠN 3: Ngày 2026-06-23
    -- ==========================================
    -- UserID 4 (Pham Gia Han) đặt HLV ID 7 (Hoang Long)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_COACH_20260623_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 4, 'Coach', '2026-06-23', 450000, 450000, 'Paid', '2026-06-23 15:45:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 7, '2026-06-23', '16:00:00', '17:00:00', 450000, 450000, '2026-06-23 15:45:00');
    SET @NewDetailID = SCOPE_IDENTITY();

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'VNPay', 450000, 'PAY_COACH_20260623_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_COACH_20260623_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-23 15:55:00', '2026-06-23 15:45:00');

    INSERT INTO CoachIncome (CoachID, BookingID, GrossAmount, CommissionRate, NetAmount, Status, CreatedAt, PaidAt)
    VALUES (7, @NewBookingID, 450000, 15.00, 382500, 'Paid', '2026-06-23 15:55:00', '2026-06-23 16:00:00');

    -- ==========================================
    -- ĐƠN 4: Ngày 2026-06-25
    -- ==========================================
    -- UserID 5 (Vo Thanh Dat) đặt HLV ID 8 (Tran Bao Tram)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_COACH_20260625_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 5, 'Coach', '2026-06-25', 500000, 500000, 'Paid', '2026-06-25 17:30:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 8, '2026-06-25', '18:00:00', '19:00:00', 500000, 500000, '2026-06-25 17:30:00');
    SET @NewDetailID = SCOPE_IDENTITY();

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'BankTransfer', 500000, 'PAY_COACH_20260625_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_COACH_20260625_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-25 17:40:00', '2026-06-25 17:30:00');

    INSERT INTO CoachIncome (CoachID, BookingID, GrossAmount, CommissionRate, NetAmount, Status, CreatedAt, PaidAt)
    VALUES (8, @NewBookingID, 500000, 15.00, 425000, 'Paid', '2026-06-25 17:40:00', '2026-06-25 18:00:00');

    -- ==========================================
    -- ĐƠN 5: Ngày 2026-06-26 (Hôm nay)
    -- ==========================================
    -- UserID 6 (Hoang Thi Linh) đặt HLV ID 5 (Nguyen Minh Khoa)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_COACH_20260626_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 6, 'Coach', '2026-06-26', 350000, 350000, 'Paid', '2026-06-26 09:45:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 5, '2026-06-26', '10:00:00', '11:00:00', 350000, 350000, '2026-06-26 09:45:00');
    SET @NewDetailID = SCOPE_IDENTITY();

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'PayOS', 350000, 'PAY_COACH_20260626_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_COACH_20260626_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-26 09:55:00', '2026-06-26 09:45:00');

    INSERT INTO CoachIncome (CoachID, BookingID, GrossAmount, CommissionRate, NetAmount, Status, CreatedAt, PaidAt)
    VALUES (5, @NewBookingID, 350000, 15.00, 297500, 'Paid', '2026-06-26 09:55:00', '2026-06-26 10:00:00');

    COMMIT TRANSACTION;
    PRINT 'SUCCESS: 5 Coach Bookings, Details, Payments, and Income logs inserted successfully.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMessage, 16, 1);
END CATCH;
`;

async function run() {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      server: process.env.DB_SERVER || "localhost",
      options: { encrypt: false, trustServerCertificate: true },
    });
    
    console.log("Connecting to SQL Server for Coach Bookings...");
    await pool.query(queryStr);
    console.log("Coach bookings and income logs inserted successfully!");
  } catch (err) {
    console.error("Error executing SQL script:", err);
  }
  process.exit(0);
}

run();
