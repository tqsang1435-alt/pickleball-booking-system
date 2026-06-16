-- 1. Rollback Bookings
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Bookings_BookedByStaffID')
BEGIN
    ALTER TABLE dbo.Bookings DROP CONSTRAINT FK_Bookings_BookedByStaffID;
END

IF COL_LENGTH('dbo.Bookings', 'GuestName') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP COLUMN GuestName;
END

IF COL_LENGTH('dbo.Bookings', 'GuestPhone') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP COLUMN GuestPhone;
END

IF COL_LENGTH('dbo.Bookings', 'BookedByStaffID') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP COLUMN BookedByStaffID;
END

IF COL_LENGTH('dbo.Bookings', 'PaymentMethod') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP COLUMN PaymentMethod;
END

IF COL_LENGTH('dbo.Bookings', 'PaymentStatus') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Bookings DROP COLUMN PaymentStatus;
END

-- 2. Rollback Payments
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Payments_ConfirmedByStaffID')
BEGIN
    ALTER TABLE dbo.Payments DROP CONSTRAINT FK_Payments_ConfirmedByStaffID;
END

IF COL_LENGTH('dbo.Payments', 'ConfirmedByStaffID') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Payments DROP COLUMN ConfirmedByStaffID;
END

IF COL_LENGTH('dbo.Payments', 'Note') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Payments DROP COLUMN Note;
END

-- Rollback CK_Payments_PaymentMethod
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Payments_PaymentMethod')
BEGIN
    ALTER TABLE dbo.Payments DROP CONSTRAINT CK_Payments_PaymentMethod;
    ALTER TABLE dbo.Payments WITH NOCHECK ADD CONSTRAINT CK_Payments_PaymentMethod CHECK (PaymentMethod IN ('VNPay', 'Momo'));
END

-- 3. Rollback Refunds
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_Refunds_RefundMethod')
BEGIN
    ALTER TABLE dbo.Refunds DROP CONSTRAINT CHK_Refunds_RefundMethod;
END

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_Refunds_RefundCode')
BEGIN
    ALTER TABLE dbo.Refunds DROP CONSTRAINT UQ_Refunds_RefundCode;
END
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Refunds_RefundCode' AND object_id = OBJECT_ID('dbo.Refunds'))
BEGIN
    DROP INDEX UQ_Refunds_RefundCode ON dbo.Refunds;
END

IF COL_LENGTH('dbo.Refunds', 'RefundCode') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Refunds DROP COLUMN RefundCode;
END
IF COL_LENGTH('dbo.Refunds', 'RefundMethod') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Refunds DROP COLUMN RefundMethod;
END
IF COL_LENGTH('dbo.Refunds', 'GatewayRefundId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Refunds DROP COLUMN GatewayRefundId;
END
IF COL_LENGTH('dbo.Refunds', 'GatewayResponse') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Refunds DROP COLUMN GatewayResponse;
END
IF COL_LENGTH('dbo.Refunds', 'CreatedBy') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Refunds DROP COLUMN CreatedBy;
END
IF COL_LENGTH('dbo.Refunds', 'ProcessedBy') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Refunds DROP COLUMN ProcessedBy;
END
IF COL_LENGTH('dbo.Refunds', 'UpdatedAt') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Refunds DROP COLUMN UpdatedAt;
END

-- 4. Rollback Promotions UpdatedAt
IF COL_LENGTH('dbo.Promotions', 'UpdatedAt') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Promotions DROP COLUMN UpdatedAt;
END
IF COL_LENGTH('dbo.UserPromotions', 'UpdatedAt') IS NOT NULL
BEGIN
    ALTER TABLE dbo.UserPromotions DROP COLUMN UpdatedAt;
END
IF COL_LENGTH('dbo.PromotionUsages', 'UpdatedAt') IS NOT NULL
BEGIN
    ALTER TABLE dbo.PromotionUsages DROP COLUMN UpdatedAt;
END

PRINT 'Rollback successful!';
GO
