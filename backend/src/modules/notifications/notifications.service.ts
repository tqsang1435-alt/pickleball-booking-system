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
