const sql = require("mssql");
require("dotenv").config({ path: ".env.local" });

const queryStr = `
-- Dùng Database cấu hình trong env
BEGIN TRANSACTION;
BEGIN TRY
    -- Khai báo biến tạm
    DECLARE @NewBookingID INT;
    DECLARE @NewPaymentID INT;

    -- Xóa các dữ liệu mẫu cũ để tránh trùng lặp
    DELETE FROM Refunds WHERE BookingID IN (SELECT BookingID FROM Bookings WHERE BookingCode LIKE 'BK_2026%');
    DELETE FROM Payments WHERE BookingID IN (SELECT BookingID FROM Bookings WHERE BookingCode LIKE 'BK_2026%');
    DELETE FROM BookingDetails WHERE BookingID IN (SELECT BookingID FROM Bookings WHERE BookingCode LIKE 'BK_2026%');
    DELETE FROM Bookings WHERE BookingCode LIKE 'BK_2026%';

    -- ==========================================
    -- NGÀY 1: 2026-06-20
    -- ==========================================
    -- Booking 1: Court - UserID 2 (Tran Bao Chau)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260620_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 2, 'Court', '2026-06-20', 150000, 150000, 'Paid', '2026-06-20 10:00:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 1, '2026-06-20', '10:00:00', '11:30:00', 150000, 0, 150000, '2026-06-20 10:00:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'PayOS', 150000, 'PAY_20260620_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260620_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-20 10:15:00', '2026-06-20 10:00:00');

    -- Booking 2: Coach - UserID 3 (Le Quoc Huy)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260620_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 3, 'Coach', '2026-06-20', 350000, 350000, 'Paid', '2026-06-20 15:00:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 5, '2026-06-20', '15:00:00', '16:00:00', 0, 350000, 350000, '2026-06-20 15:00:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'Momo', 350000, 'PAY_20260620_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260620_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-20 15:30:00', '2026-06-20 15:00:00');

    -- ==========================================
    -- NGÀY 2: 2026-06-21
    -- ==========================================
    -- Booking 1: Combo - UserID 4 (Pham Gia Han)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260621_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 4, 'Combo', '2026-06-21', 200000, 400000, 600000, 'Paid', '2026-06-21 08:30:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, CoachID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 2, 8, '2026-06-21', '08:30:00', '10:30:00', 200000, 400000, 600000, '2026-06-21 08:30:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'VNPay', 600000, 'PAY_20260621_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260621_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-21 08:45:00', '2026-06-21 08:30:00');

    -- Booking 2: Court - UserID 5 (Vo Thanh Dat)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260621_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 5, 'Court', '2026-06-21', 200000, 200000, 'Paid', '2026-06-21 13:45:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 2, '2026-06-21', '13:00:00', '15:00:00', 200000, 0, 200000, '2026-06-21 13:45:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'Cash', 200000, 'PAY_20260621_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260621_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-21 14:00:00', '2026-06-21 13:45:00');

    -- ==========================================
    -- NGÀY 3: 2026-06-22
    -- ==========================================
    -- Booking 1: Coach - UserID 6 (Hoang Thi Linh)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260622_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 6, 'Coach', '2026-06-22', 400000, 400000, 'Paid', '2026-06-22 17:00:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 7, '2026-06-22', '17:00:00', '18:00:00', 0, 400000, 400000, '2026-06-22 17:00:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'BankTransfer', 400000, 'PAY_20260622_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260622_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-22 17:20:00', '2026-06-22 17:00:00');

    -- ==========================================
    -- NGÀY 4: 2026-06-23
    -- ==========================================
    -- Booking 1: Court - UserID 2 (Tran Bao Chau)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260623_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 2, 'Court', '2026-06-23', 180000, 180000, 'Paid', '2026-06-23 09:15:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 4, '2026-06-23', '09:00:00', '10:00:00', 180000, 0, 180000, '2026-06-23 09:15:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'PayOS', 180000, 'PAY_20260623_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260623_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-23 09:30:00', '2026-06-23 09:15:00');

    -- Booking 2: Combo - UserID 3 (Le Quoc Huy)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260623_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 3, 'Combo', '2026-06-23', 150000, 400000, 550000, 'Paid', '2026-06-23 18:45:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, CoachID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 1, 5, '2026-06-23', '18:00:00', '19:30:00', 150000, 400000, 550000, '2026-06-23 18:45:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'Momo', 550000, 'PAY_20260623_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260623_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-23 19:10:00', '2026-06-23 18:45:00');

    -- Booking 3: Court (Refunded) - UserID 4 (Pham Gia Han)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260623_003_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 4, 'Court', '2026-06-23', 150000, 150000, 'Refunded', '2026-06-23 10:45:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 2, '2026-06-23', '10:00:00', '11:30:00', 150000, 0, 150000, '2026-06-23 10:45:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'Momo', 150000, 'PAY_20260623_003_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260623_003_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Refunded', '2026-06-23 11:00:00', '2026-06-23 10:45:00');
    SET @NewPaymentID = SCOPE_IDENTITY();

    INSERT INTO Refunds (BookingID, PaymentID, RefundAmount, Reason, Status, RequestedAt, ProcessedAt)
    VALUES (@NewBookingID, @NewPaymentID, 150000, N'Khách hàng bận đột xuất', 'Completed', '2026-06-23 12:00:00', '2026-06-23 14:00:00');

    -- ==========================================
    -- NGÀY 5: 2026-06-24
    -- ==========================================
    -- Booking 1: Coach - UserID 5 (Vo Thanh Dat)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260624_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 5, 'Coach', '2026-06-24', 350000, 350000, 'Paid', '2026-06-24 16:00:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 5, '2026-06-24', '16:00:00', '17:00:00', 0, 350000, 350000, '2026-06-24 16:00:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'VNPay', 350000, 'PAY_20260624_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260624_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-24 16:15:00', '2026-06-24 16:00:00');

    -- Booking 2: Court - UserID 6 (Hoang Thi Linh)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260624_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 6, 'Court', '2026-06-24', 220000, 220000, 'Paid', '2026-06-24 12:30:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 3, '2026-06-24', '12:30:00', '13:30:00', 220000, 0, 220000, '2026-06-24 12:30:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'PayOS', 220000, 'PAY_20260624_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260624_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-24 12:45:00', '2026-06-24 12:30:00');

    -- ==========================================
    -- NGÀY 6: 2026-06-25
    -- ==========================================
    -- Booking 1: Combo - UserID 2 (Tran Bao Chau)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260625_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 2, 'Combo', '2026-06-25', 300000, 500000, 800000, 'Paid', '2026-06-25 09:45:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, CoachID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 4, 1, '2026-06-25', '09:45:00', '10:45:00', 300000, 500000, 800000, '2026-06-25 09:45:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'BankTransfer', 800000, 'PAY_20260625_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260625_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-25 10:00:00', '2026-06-25 09:45:00');

    -- Booking 2: Court (Refunded) - UserID 3 (Le Quoc Huy)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260625_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 3, 'Court', '2026-06-25', 150000, 150000, 'Refunded', '2026-06-25 14:00:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 1, '2026-06-25', '14:00:00', '15:30:00', 150000, 0, 150000, '2026-06-25 14:00:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'PayOS', 150000, 'PAY_20260625_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260625_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Refunded', '2026-06-25 14:30:00', '2026-06-25 14:00:00');
    SET @NewPaymentID = SCOPE_IDENTITY();

    INSERT INTO Refunds (BookingID, PaymentID, RefundAmount, Reason, Status, RequestedAt, ProcessedAt)
    VALUES (@NewBookingID, @NewPaymentID, 150000, N'Trùng lịch cá nhân', 'Completed', '2026-06-25 15:00:00', '2026-06-25 16:00:00');

    -- ==========================================
    -- NGÀY 7: 2026-06-26 (Hôm nay)
    -- ==========================================
    -- Booking 1: Court - UserID 4 (Pham Gia Han)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CourtFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260626_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 4, 'Court', '2026-06-26', 300000, 300000, 'Paid', '2026-06-26 08:15:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CourtID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 2, '2026-06-26', '08:00:00', '10:00:00', 300000, 0, 300000, '2026-06-26 08:15:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'PayOS', 300000, 'PAY_20260626_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260626_001_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-26 08:30:00', '2026-06-26 08:15:00');

    -- Booking 2: Coach - UserID 5 (Vo Thanh Dat)
    INSERT INTO Bookings (BookingCode, UserID, BookingType, BookingDate, CoachFee, TotalAmount, Status, CreatedAt)
    VALUES ('BK_20260626_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 5, 'Coach', '2026-06-26', 450000, 450000, 'Paid', '2026-06-26 09:30:00');
    SET @NewBookingID = SCOPE_IDENTITY();

    INSERT INTO BookingDetails (BookingID, CoachID, BookingDate, StartTime, EndTime, CourtFee, CoachFee, SubTotal, CreatedAt)
    VALUES (@NewBookingID, 2, '2026-06-26', '09:30:00', '11:00:00', 0, 450000, 450000, '2026-06-26 09:30:00');

    INSERT INTO Payments (BookingID, PaymentMethod, Amount, PaymentCode, TransactionCode, Status, PaidAt, CreatedAt)
    VALUES (@NewBookingID, 'Momo', 450000, 'PAY_20260626_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'TX_20260626_002_' + SUBSTRING(CONVERT(varchar(40), NEWID()), 1, 5), 'Paid', '2026-06-26 09:45:00', '2026-06-26 09:30:00');

    COMMIT TRANSACTION;
    PRINT 'SUCCESS: 14 Bookings, 14 Payments, 2 Refunds, and 14 BookingDetails inserted successfully.';
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
    
    console.log("Connecting to SQL Server...");
    const res = await pool.query(queryStr);
    console.log("Data inserted successfully with BookingDetails!");
  } catch (err) {
    console.error("Error executing SQL script:", err);
  }
  process.exit(0);
}

run();
