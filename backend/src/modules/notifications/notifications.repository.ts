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

// ── Email Notification Logs ────────────────────────────

export async function findRecentEmailLog(userId: number, notificationType: string, groupId: number | null, cooldownMinutes: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input("UserID", sql.Int, userId)
    .input("NotificationType", sql.NVarChar(50), notificationType)
    .input("GroupID", sql.Int, groupId)
    .input("Cooldown", sql.Int, cooldownMinutes)
    .query(`
      SELECT TOP 1 EmailLogID
      FROM EmailNotificationLogs
      WHERE UserID = @UserID
        AND NotificationType = @NotificationType
        AND (GroupID = @GroupID OR (@GroupID IS NULL AND GroupID IS NULL))
        AND SentAt >= DATEADD(MINUTE, -@Cooldown, GETDATE())
        AND Status IN ('Reserved', 'Sending', 'Sent')
    `);
  return result.recordset[0] || null;
}

export async function createEmailLog(params: {
  userId: number;
  email: string;
  notificationType: string;
  refType?: string;
  refId?: number;
  groupId?: number;
  status: string;
  errorMessage?: string;
  cooldownMinutes?: number;
}): Promise<number | null> {
  const pool = await getPool();
  const request = pool.request()
    .input("UserID", sql.Int, params.userId)
    .input("Email", sql.NVarChar(255), params.email)
    .input("NotificationType", sql.NVarChar(50), params.notificationType)
    .input("RefType", sql.NVarChar(50), params.refType || null)
    .input("RefID", sql.Int, params.refId || null)
    .input("GroupID", sql.Int, params.groupId || null)
    .input("Status", sql.NVarChar(20), params.status)
    .input("ErrorMessage", sql.NVarChar(sql.MAX), params.errorMessage || null);

  if (params.cooldownMinutes) {
    request.input("Cooldown", sql.Int, params.cooldownMinutes);
    const result = await request.query(`
      INSERT INTO EmailNotificationLogs (UserID, Email, NotificationType, RefType, RefID, GroupID, Status, ErrorMessage)
      OUTPUT INSERTED.EmailLogID
      SELECT @UserID, @Email, @NotificationType, @RefType, @RefID, @GroupID, @Status, @ErrorMessage
      WHERE NOT EXISTS (
        SELECT 1 FROM EmailNotificationLogs
        WHERE UserID = @UserID
          AND NotificationType = @NotificationType
          AND (GroupID = @GroupID OR (@GroupID IS NULL AND GroupID IS NULL))
          AND SentAt >= DATEADD(MINUTE, -@Cooldown, GETDATE())
          AND Status IN ('Reserved', 'Sending', 'Sent')
      )
    `);
    return result.recordset[0]?.EmailLogID || null;
  } else {
    const result = await request.query(`
      INSERT INTO EmailNotificationLogs (UserID, Email, NotificationType, RefType, RefID, GroupID, Status, ErrorMessage)
      OUTPUT INSERTED.EmailLogID
      VALUES (@UserID, @Email, @NotificationType, @RefType, @RefID, @GroupID, @Status, @ErrorMessage)
    `);
    return result.recordset[0]?.EmailLogID || null;
  }
}

export async function updateEmailLogStatus(emailLogId: number, status: string, errorMessage?: string) {
  const pool = await getPool();
  await pool.request()
    .input("EmailLogID", sql.Int, emailLogId)
    .input("Status", sql.NVarChar(20), status)
    .input("ErrorMessage", sql.NVarChar(sql.MAX), errorMessage || null)
    .query(`
      UPDATE EmailNotificationLogs
      SET Status = @Status, ErrorMessage = @ErrorMessage
      WHERE EmailLogID = @EmailLogID
    `);
}

export async function getActiveGroupMembersForEmail(groupId: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input("GroupID", sql.Int, groupId)
    .query(`
      SELECT u.UserID, u.Email, u.FullName
      FROM GroupMembers gm
      JOIN Users u ON gm.UserID = u.UserID
      WHERE gm.GroupID = @GroupID
        AND gm.Status = 'Active'
        AND u.Status = 'Active'
        AND u.Email IS NOT NULL
        AND LEN(LTRIM(RTRIM(u.Email))) > 0
    `);
  return result.recordset;
}

export async function getUserEmailInfo(userId: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input("UserID", sql.Int, userId)
    .query(`
      SELECT UserID, Email, FullName
      FROM Users
      WHERE UserID = @UserID
        AND Status = 'Active'
        AND Email IS NOT NULL
        AND LEN(LTRIM(RTRIM(Email))) > 0
    `);
  return result.recordset[0] || null;
}

export async function getGroupInfoForEmail(groupId: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input("GroupID", sql.Int, groupId)
    .query(`
      SELECT GroupID, GroupName
      FROM PlayingGroups
      WHERE GroupID = @GroupID
    `);
  return result.recordset[0] || null;
}
