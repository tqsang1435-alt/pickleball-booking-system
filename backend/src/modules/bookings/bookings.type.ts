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