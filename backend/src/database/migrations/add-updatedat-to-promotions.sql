-- Migration: Add UpdatedAt column to Promotions table
-- Date: 2024

-- Check if column doesn't exist before adding
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Promotions') 
    AND name = 'UpdatedAt'
)
BEGIN
    ALTER TABLE Promotions
    ADD UpdatedAt DATETIME NULL;

    -- Set default value for existing rows
    EXEC('UPDATE Promotions SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL');

    PRINT 'Added UpdatedAt column to Promotions table';
END
ELSE
BEGIN
    PRINT 'UpdatedAt column already exists in Promotions table';
END
GO

-- Do the same for UserPromotions table
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('UserPromotions') 
    AND name = 'UpdatedAt'
)
BEGIN
    ALTER TABLE UserPromotions
    ADD UpdatedAt DATETIME NULL;

    EXEC('UPDATE UserPromotions SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL');

    PRINT 'Added UpdatedAt column to UserPromotions table';
END
ELSE
BEGIN
    PRINT 'UpdatedAt column already exists in UserPromotions table';
END
GO

-- Do the same for PromotionUsages table
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('PromotionUsages') 
    AND name = 'UpdatedAt'
)
BEGIN
    ALTER TABLE PromotionUsages
    ADD UpdatedAt DATETIME NULL;

    EXEC('UPDATE PromotionUsages SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL');

    PRINT 'Added UpdatedAt column to PromotionUsages table';
END
ELSE
BEGIN
    PRINT 'UpdatedAt column already exists in PromotionUsages table';
END
GO

PRINT 'Migration completed: Added UpdatedAt columns to promotion tables';
