import { getPool, sql } from "@/database/connection";

export interface InsertSystemLogInput {
  userId: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  description: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Ghi một dòng audit log vào DB.
 * Nếu table chưa tồn tại thì tự động tạo.
 */
export async function insertSystemLog(input: InsertSystemLogInput): Promise<void> {
  const pool = await getPool();

  // Tạo table nếu chưa có
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.SystemLogs', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SystemLogs (
        LogID       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserID      INT NULL,
        [Action]    NVARCHAR(100) NOT NULL,
        EntityType  NVARCHAR(100) NULL,
        EntityID    INT NULL,
        Description NVARCHAR(MAX) NULL,
        OldValue    NVARCHAR(MAX) NULL,
        NewValue    NVARCHAR(MAX) NULL,
        IPAddress   NVARCHAR(50) NULL,
        UserAgent   NVARCHAR(500) NULL,
        CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
      CREATE INDEX IX_SystemLogs_UserID    ON dbo.SystemLogs (UserID);
      CREATE INDEX IX_SystemLogs_Action    ON dbo.SystemLogs ([Action]);
      CREATE INDEX IX_SystemLogs_CreatedAt ON dbo.SystemLogs (CreatedAt DESC);
    END
  `);

  await pool.request()
    .input("UserID",      sql.Int,              input.userId || null)
    .input("Action",      sql.NVarChar(100),    input.action)
    .input("EntityType",  sql.NVarChar(100),    input.entityType)
    .input("EntityID",    sql.Int,              input.entityId)
    .input("Description", sql.NVarChar(sql.MAX), input.description)
    .input("OldValue",    sql.NVarChar(sql.MAX), input.oldValue)
    .input("NewValue",    sql.NVarChar(sql.MAX), input.newValue)
    .input("IPAddress",   sql.NVarChar(50),     input.ipAddress)
    .input("UserAgent",   sql.NVarChar(500),    input.userAgent)
    .query(`
      INSERT INTO dbo.SystemLogs
        (UserID, [Action], EntityType, EntityID, Description, OldValue, NewValue, IPAddress, UserAgent)
      VALUES
        (@UserID, @Action, @EntityType, @EntityID, @Description, @OldValue, @NewValue, @IPAddress, @UserAgent)
    `);
}

export async function deleteLogsOlderThan(days: number): Promise<void> {
  const pool = await getPool();
  await pool.request()
    .input("Days", sql.Int, days)
    .query(`
      DELETE FROM dbo.SystemLogs
      WHERE CreatedAt < DATEADD(DAY, -@Days, SYSUTCDATETIME())
    `);
}
