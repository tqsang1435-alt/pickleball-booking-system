IF COL_LENGTH('dbo.Bookings', 'GuestName') IS NULL
  ALTER TABLE dbo.Bookings ADD GuestName NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Bookings', 'GuestPhone') IS NULL
  ALTER TABLE dbo.Bookings ADD GuestPhone NVARCHAR(20) NULL;

IF COL_LENGTH('dbo.Bookings', 'BookedByStaffID') IS NULL
  ALTER TABLE dbo.Bookings ADD BookedByStaffID INT NULL;

IF COL_LENGTH('dbo.Bookings', 'PaymentMethod') IS NULL
  ALTER TABLE dbo.Bookings ADD PaymentMethod NVARCHAR(50) NULL;

IF COL_LENGTH('dbo.Bookings', 'PaymentStatus') IS NULL
  ALTER TABLE dbo.Bookings ADD PaymentStatus NVARCHAR(30) NULL;

IF COL_LENGTH('dbo.Payments', 'ConfirmedByStaffID') IS NULL
  ALTER TABLE dbo.Payments ADD ConfirmedByStaffID INT NULL;

IF COL_LENGTH('dbo.Payments', 'Note') IS NULL
  ALTER TABLE dbo.Payments ADD Note NVARCHAR(255) NULL;

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE name = 'FK_Bookings_BookedByStaffID'
    AND parent_object_id = OBJECT_ID('dbo.Bookings')
)
BEGIN
  ALTER TABLE dbo.Bookings
  ADD CONSTRAINT FK_Bookings_BookedByStaffID
  FOREIGN KEY (BookedByStaffID) REFERENCES dbo.Users(UserID);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE name = 'FK_Payments_ConfirmedByStaffID'
    AND parent_object_id = OBJECT_ID('dbo.Payments')
)
BEGIN
  ALTER TABLE dbo.Payments
  ADD CONSTRAINT FK_Payments_ConfirmedByStaffID
  FOREIGN KEY (ConfirmedByStaffID) REFERENCES dbo.Users(UserID);
END;
