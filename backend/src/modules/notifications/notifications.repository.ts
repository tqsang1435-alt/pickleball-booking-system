import { getPool, sql } from "@/database/connection";
import type { CreateNotificationInput } from "./notifications.type";

export async function insertNotification(input: CreateNotificationInput) {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, input.userId)
    .input("Title", sql.NVarChar(100), input.title)
    .input("Message", sql.NVarChar(500), input.message)
    .input("NotificationType", sql.NVarChar(50), input.notificationType)
    .query(`
      INSERT INTO Notifications (UserID, Title, Message, NotificationType, Status, CreatedAt)
      VALUES (@UserID, @Title, @Message, @NotificationType, 'Unread', GETDATE())
    `);
}
