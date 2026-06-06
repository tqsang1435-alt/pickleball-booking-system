import { getPool, sql } from "@/database/connection";
import type { CreateNotificationInput, NotificationItem } from "./notifications.type";

export async function insertNotification(input: CreateNotificationInput): Promise<void> {
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

export async function getMyNotifications(userId: number, limit: number = 50): Promise<NotificationItem[]> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .input("Limit", sql.Int, limit)
    .query(`
      SELECT TOP (@Limit)
        NotificationID as notificationId,
        Title as title,
        Message as message,
        NotificationType as notificationType,
        Status as status,
        CONVERT(varchar(19), CreatedAt, 126) as createdAt
      FROM Notifications
      WHERE UserID = @UserID AND Status != 'Deleted'
      ORDER BY CreatedAt DESC
    `);

  return result.recordset;
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT COUNT(*) as UnreadCount
      FROM Notifications
      WHERE UserID = @UserID AND Status = 'Unread'
    `);

  return result.recordset[0]?.UnreadCount || 0;
}

export async function markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
  const pool = await getPool();

  await pool
    .request()
    .input("NotificationID", sql.Int, notificationId)
    .input("UserID", sql.Int, userId)
    .query(`
      UPDATE Notifications
      SET Status = 'Read'
      WHERE NotificationID = @NotificationID AND UserID = @UserID AND Status = 'Unread'
    `);
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const pool = await getPool();

  await pool
    .request()
    .input("UserID", sql.Int, userId)
    .query(`
      UPDATE Notifications
      SET Status = 'Read'
      WHERE UserID = @UserID AND Status = 'Unread'
    `);
}
