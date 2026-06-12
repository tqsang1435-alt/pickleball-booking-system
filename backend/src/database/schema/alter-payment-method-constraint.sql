-- ==========================================
-- alter-payment-method-constraint.sql
-- Update constraint cho Payments.PaymentMethod
-- Cho phép thêm 'Momo'
-- ==========================================

-- Xoá constraint cũ nếu có (thay đổi tên constraint CHK_Payments_PaymentMethod nếu tên trong DB khác)
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_Payments_PaymentMethod' AND parent_object_id = OBJECT_ID('Payments'))
BEGIN
    ALTER TABLE Payments DROP CONSTRAINT CHK_Payments_PaymentMethod;
END

-- Thêm constraint mới
ALTER TABLE Payments
ADD CONSTRAINT CHK_Payments_PaymentMethod CHECK (PaymentMethod IN ('PayOS', 'Momo'));
