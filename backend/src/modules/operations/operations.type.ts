export type OperationSummary = {
  totalBookings: number;
  waitingCheckIn: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
  noShow: number;
};

export type OperationBooking = {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  courtName: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string | null;
  checkInTime: string | null;
};

export type TodayOperationsData = {
  summary: OperationSummary;
  bookings: OperationBooking[];
  autoNoShowCount?: number;
};
