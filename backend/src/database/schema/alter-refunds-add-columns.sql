-- ==========================================
-- alter-refunds-add-columns.sql
-- Migration dựa trên schema thực tế PCS_System_3
-- Chạy trong SSMS với database PCS_System_3
-- ==========================================

USE [PCS_System_3]
GO

-- ══════════════════════════════════════════════════════
-- PHẦN 1: Bảng Refunds — Thêm 7 cột mới
-- ══════════════════════════════════════════════════════

-- Bước 1: RefundCode
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'RefundCode'
)
BEGIN
  ALTER TABLE [dbo].[Refunds] ADD [RefundCode] [nvarchar](100) NULL;
  PRINT '✓ Added: Refunds.RefundCode';
END
ELSE PRINT '– Skip: Refunds.RefundCode already exists';
GO

-- Bước 2: RefundMethod (constraint inline với ADD COLUMN)
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'RefundMethod'
)
BEGIN
  ALTER TABLE [dbo].[Refunds] ADD [RefundMethod] [nvarchar](50) NULL
    CONSTRAINT [CHK_Refunds_RefundMethod]
    CHECK ([RefundMethod] IS NULL OR [RefundMethod] IN ('Momo', 'PayOSManual', 'Manual'));
  PRINT '✓ Added: Refunds.RefundMethod';
END
ELSE PRINT '– Skip: Refunds.RefundMethod already exists';
GO

-- Bước 3: GatewayRefundId
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'GatewayRefundId'
)
BEGIN
  ALTER TABLE [dbo].[Refunds] ADD [GatewayRefundId] [nvarchar](255) NULL;
  PRINT '✓ Added: Refunds.GatewayRefundId';
END
ELSE PRINT '– Skip: Refunds.GatewayRefundId already exists';
GO

-- Bước 4: GatewayResponse
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'GatewayResponse'
)
BEGIN
  ALTER TABLE [dbo].[Refunds] ADD [GatewayResponse] [nvarchar](max) NULL;
  PRINT '✓ Added: Refunds.GatewayResponse';
END
ELSE PRINT '– Skip: Refunds.GatewayResponse already exists';
GO

-- Bước 5: CreatedBy
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'CreatedBy'
)
BEGIN
  ALTER TABLE [dbo].[Refunds] ADD [CreatedBy] [int] NULL;
  PRINT '✓ Added: Refunds.CreatedBy';
END
ELSE PRINT '– Skip: Refunds.CreatedBy already exists';
GO

-- Bước 6: ProcessedBy
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'ProcessedBy'
)
BEGIN
  ALTER TABLE [dbo].[Refunds] ADD [ProcessedBy] [int] NULL;
  PRINT '✓ Added: Refunds.ProcessedBy';
END
ELSE PRINT '– Skip: Refunds.ProcessedBy already exists';
GO

-- Bước 7: UpdatedAt
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'UpdatedAt'
)
BEGIN
  ALTER TABLE [dbo].[Refunds] ADD [UpdatedAt] [datetime] NULL;
  PRINT '✓ Added: Refunds.UpdatedAt';
END
ELSE PRINT '– Skip: Refunds.UpdatedAt already exists';
GO

-- Bước 8: Unique Index cho RefundCode (filtered)
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID('dbo.Refunds') AND name = 'UQ_Refunds_RefundCode'
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX [UQ_Refunds_RefundCode]
  ON [dbo].[Refunds]([RefundCode] ASC)
  WHERE ([RefundCode] IS NOT NULL)
  WITH (
    PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF,
    IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF,
    ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON
  ) ON [PRIMARY];
  PRINT '✓ Created index: UQ_Refunds_RefundCode';
END
ELSE PRINT '– Skip: Index UQ_Refunds_RefundCode already exists';
GO

-- ══════════════════════════════════════════════════════
-- PHẦN 2: Bảng Payments — Xóa VNPay khỏi constraint
-- (PCS.sql có CK_Payments_PaymentMethod gồm VNPay + Momo + PayOS)
-- ══════════════════════════════════════════════════════

-- Bước 9: Xóa constraint cũ (có VNPay)
IF EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE parent_object_id = OBJECT_ID('dbo.Payments') AND name = 'CK_Payments_PaymentMethod'
)
BEGIN
  ALTER TABLE [dbo].[Payments] DROP CONSTRAINT [CK_Payments_PaymentMethod];
  PRINT '✓ Dropped: CK_Payments_PaymentMethod (old, included VNPay)';
END
ELSE PRINT '– Skip: CK_Payments_PaymentMethod not found (already removed)';
GO

-- Bước 10: Thêm constraint mới (chỉ Momo + PayOS)
IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE parent_object_id = OBJECT_ID('dbo.Payments') AND name = 'CK_Payments_PaymentMethod'
)
BEGIN
  ALTER TABLE [dbo].[Payments]
  ADD CONSTRAINT [CK_Payments_PaymentMethod]
  CHECK ([PaymentMethod] = 'PayOS' OR [PaymentMethod] = 'Momo');
  PRINT '✓ Added: CK_Payments_PaymentMethod (PayOS + Momo only)';
END
ELSE PRINT '– Skip: CK_Payments_PaymentMethod already updated';
GO

-- ══════════════════════════════════════════════════════
-- VERIFY: Kiểm tra kết quả
-- ══════════════════════════════════════════════════════

PRINT '--- Cấu trúc bảng Refunds sau migration ---';
SELECT
  c.column_id    AS [#],
  c.name         AS [ColumnName],
  t.name         AS [DataType],
  c.max_length   AS [MaxLen],
  c.is_nullable  AS [Nullable]
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.Refunds')
ORDER BY c.column_id;
GO

PRINT '--- Constraints trên bảng Payments ---';
SELECT
  cc.name        AS [ConstraintName],
  cc.definition  AS [Definition]
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID('dbo.Payments');
GO
