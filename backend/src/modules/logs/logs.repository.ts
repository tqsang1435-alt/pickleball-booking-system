import { getPool, sql } from "@/database/connection";

export type AuditLogInput = {
  userId?: number | null;
  actionName: string;
  tableName?: string;
  entityId?: number;
  description?: string;
  ipAddress?: string;
};

export async function insertAuditLog(input: AuditLogInput): Promise<void> {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, input.userId)
    .input("ActionName", sql.NVarChar(100), input.actionName)
    .input("TableName", sql.NVarChar(100), input.tableName || null)
    .input("EntityID", sql.Int, input.entityId || null)
    .input("Description", sql.NVarChar(500), input.description || null)
    .input("IPAddress", sql.NVarChar(50), input.ipAddress || null)
    .query(`
      INSERT INTO AuditLogs (UserID, ActionName, TableName, EntityID, Description, IPAddress, CreatedAt)
      VALUES (@UserID, @ActionName, @TableName, @EntityID, @Description, @IPAddress, GETDATE())
    `);
}
