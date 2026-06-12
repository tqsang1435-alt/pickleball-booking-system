-- ============================================================
-- Migration: Add 'PayOS' to Payments.PaymentMethod constraint
-- Run this ONCE on your SQL Server before testing PayOS.
-- Safe: checks constraint existence before dropping.
-- ============================================================

USE PCS_System_3;
GO

-- Step 1: Drop existing CHECK constraint on PaymentMethod (if exists)
DECLARE @constraintName NVARCHAR(200);

SELECT @constraintName = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c ON cc.parent_object_id = c.object_id
                   AND cc.parent_column_id = c.column_id
JOIN sys.tables t ON cc.parent_object_id = t.object_id
WHERE t.name = 'Payments'
  AND c.name = 'PaymentMethod';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Payments DROP CONSTRAINT [' + @constraintName + ']');
    PRINT 'Dropped existing constraint: ' + @constraintName;
END
ELSE
BEGIN
    PRINT 'No existing PaymentMethod constraint found (skipping drop).';
END
GO

-- Step 2: Add new CHECK constraint allowing VNPay, Momo, PayOS
ALTER TABLE Payments
ADD CONSTRAINT CK_Payments_PaymentMethod
CHECK (PaymentMethod IN ('VNPay', 'Momo', 'PayOS'));
GO

PRINT 'Successfully added CK_Payments_PaymentMethod with VNPay, Momo, PayOS.';
GO

-- Step 3: Verify
SELECT
    cc.name AS ConstraintName,
    cc.definition AS ConstraintDefinition
FROM sys.check_constraints cc
JOIN sys.tables t ON cc.parent_object_id = t.object_id
WHERE t.name = 'Payments';
GO
