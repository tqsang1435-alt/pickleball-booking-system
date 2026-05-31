export type BookingType = "Court" | "Coach" | "Combo";

export type CreateCourtBookingInput = {
  userId: number;
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreateCoachBookingInput = {
  userId: number;
  coachId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreateComboBookingInput = {
  userId: number;
  courtId: number;
  coachId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreatedBooking = {
  BookingID: number;
  BookingCode: string;
  UserID: number;
  BookingType: BookingType;
  BookingDate: string;
  CourtFee: number;
  CoachFee: number;
  DiscountAmount: number;
  TotalAmount: number;
  Status: string;
  CreatedAt: string;

  BookingDetailID: number;
  SlotID: number | null;
  CourtID: number | null;
  CoachID: number | null;
  CoachScheduleID: number | null;
  StartTime: string;
  EndTime: string;
};

// ===== Cancel Booking =====
export type CancelBookingInput = {
  bookingId: number;
  userId: number;
  userRoles: string[];
  cancelReason?: string;
};

export type CancelBookingResult = {
  bookingId: number;
  status: string;
  refundAmount: number;
  refundPercent: number;
  refundNote: string;
  refundRecord: object | null;
};

// ===== Check-in =====
export type CheckInInput = {
  bookingId: number;
  userId: number;
  userRoles?: string[];
};

export type CheckInResult = {
  bookingId: number;
  status: string;
  checkInTime: string;
};

// ===== Booking detail with payment (UC-19) =====
export type BookingWithPayment = {
  BookingID: number;
  BookingCode: string;
  UserID: number;
  BookingType: BookingType;
  BookingDate: string;
  CourtFee: number;
  CoachFee: number;
  DiscountAmount: number;
  TotalAmount: number;
  Status: string;
  CheckInTime: string | null;
  CancelledAt: string | null;
  CancelReason: string | null;
  CreatedAt: string;
  StartTime: string;
  EndTime: string;

  // Court info
  CourtID: number | null;
  CourtName: string | null;
  CourtCode: string | null;
  CourtImage: string | null;
  Location: string | null;

  // Coach info
  CoachID: number | null;
  CoachName: string | null;
  CoachAvatar: string | null;

  // Payment info
  PaymentID: number | null;
  PaymentMethod: string | null;
  TransactionCode: string | null;
  PaymentStatus: string | null;
  PaidAt: string | null;
};

// ===== Daily booking (UC-49) =====
export type DailyBooking = {
  BookingID: number;
  BookingCode: string;
  BookingType: BookingType;
  BookingDate: string;
  StartTime: string;
  EndTime: string;
  TotalAmount: number;
  Status: string;
  CheckInTime: string | null;

  PlayerName: string;
  PlayerEmail: string;
  PlayerPhone: string | null;

  CourtName: string | null;
  CoachName: string | null;

  PaymentMethod: string | null;
  PaymentStatus: string | null;
};