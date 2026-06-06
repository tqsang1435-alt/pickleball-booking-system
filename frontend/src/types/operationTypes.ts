export interface OperationSummary {
  totalBookings: number;
  waitingCheckIn: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface OperationBooking {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  courtName: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string | null;
  checkInTime: string | null;
}

export interface TodayOperationsResponse {
  summary: OperationSummary;
  bookings: OperationBooking[];
  autoNoShowCount?: number;
}

export interface NotificationItem {
  notificationId: number;
  title: string;
  message: string;
  notificationType: string;
  status: "Unread" | "Read" | "Deleted";
  createdAt: string;
}

export interface AuditLogItem {
  logId: number;
  action: string;
  note: string | null;
  createdAt: string;
  actorName: string;
}
