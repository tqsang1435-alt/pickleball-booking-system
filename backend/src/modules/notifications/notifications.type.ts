export type NotificationType =
  | "Booking"
  | "Payment"
  | "Refund"
  | "Reminder"
  | "Review"
  | "Matching"
  | "System";

export type CreateNotificationInput = {
  userId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
};

export type NotificationItem = {
  notificationId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  status: "Unread" | "Read" | "Deleted";
  createdAt: string | Date;
};
