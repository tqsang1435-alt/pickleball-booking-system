import * as notifRepo from "./notifications.repository";
import type { CreateNotificationInput } from "./notifications.type";

/**
 * Tao thong bao trong he thong (insert vao bang Notifications).
 * Duoc goi boi cac module khac (bookings, refunds...).
 * Khong throw error de khong anh huong den business logic chinh.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    await notifRepo.insertNotification(input);
  } catch (error) {
    // Log loi nhung khong re-throw, tranh lam hong business flow chinh
    console.error("[Notification] Failed to create notification:", error);
  }
}

export async function getMyNotifications(userId: number, limit: number = 50) {
  return notifRepo.getMyNotifications(userId, limit);
}

export async function countUnreadNotifications(userId: number) {
  return notifRepo.countUnreadNotifications(userId);
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  await notifRepo.markNotificationAsRead(notificationId, userId);
}

export async function markAllNotificationsAsRead(userId: number) {
  await notifRepo.markAllNotificationsAsRead(userId);
}
