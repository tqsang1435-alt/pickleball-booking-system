DECLARE @constraintName SYSNAME;

SELECT TOP 1 @constraintName = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID('dbo.Payments')
  AND cc.definition LIKE '%PaymentMethod%';

IF @constraintName IS NOT NULL
BEGIN
  EXEC('ALTER TABLE dbo.Payments DROP CONSTRAINT [' + @constraintName + ']');
END;

ALTER TABLE dbo.Payments
ADD CONSTRAINT CK_Payments_PaymentMethod
CHECK (PaymentMethod IN ('PayOS', 'VNPay', 'Momo', 'Cash', 'BankTransfer'));
