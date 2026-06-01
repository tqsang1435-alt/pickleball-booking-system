import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";

// ===== Types =====

export type BookingType = "Court" | "Coach" | "Combo";

export type BookingStatus =
  | "PendingPayment"
  | "Paid"
  | "Confirmed"
  | "CheckedIn"
  | "Completed"
  | "Cancelled"
  | "Refunded"
  | "NoShow";

export type Booking = {
  BookingID: number;
  BookingCode: string;
  UserID: number;
  BookingType: BookingType;
  BookingDate: string;
  CourtFee: number;
  CoachFee: number;
  DiscountAmount: number;
  TotalAmount: number;
  Status: BookingStatus;
  CheckInTime: string | null;
  CancelledAt: string | null;
  CancelReason: string | null;
  CreatedAt: string;

  // Detail
  BookingDetailID?: number;
  SlotID?: number | null;
  StartTime: string;
  EndTime: string;

  // Court
  CourtID?: number | null;
  CourtName?: string | null;
  CourtCode?: string | null;
  CourtImage?: string | null;
  Location?: string | null;

  // Coach
  CoachID?: number | null;
  CoachName?: string | null;
  CoachAvatar?: string | null;

  // Payment
  PaymentID?: number | null;
  PaymentMethod?: string | null;
  TransactionCode?: string | null;
  PaymentStatus?: string | null;
  PaidAt?: string | null;
};

export type CreateCourtBookingPayload = {
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreateCoachBookingPayload = {
  coachId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CreateComboBookingPayload = {
  courtId: number;
  coachId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
};

export type CancelResult = {
  bookingId: number;
  status: string;
  refundAmount: number;
  refundPercent: number;
  refundNote: string;
};

export type MockPayResult = {
  bookingId: number;
  bookingCode: string;
  status: string;
  paymentMethod: string;
  message: string;
};

export type DailyBooking = {
  BookingID: number;
  BookingCode: string;
  BookingType: BookingType;
  BookingDate: string;
  StartTime: string;
  EndTime: string;
  TotalAmount: number;
  Status: BookingStatus;
  CheckInTime: string | null;
  PlayerName: string;
  PlayerEmail: string;
  PlayerPhone: string | null;
  CourtName: string | null;
  CoachName: string | null;
  PaymentMethod: string | null;
  PaymentStatus: string | null;
};

// ===== API Functions =====

/** UC-13: Đặt sân */
export async function bookCourt(
  token: string,
  payload: CreateCourtBookingPayload
): Promise<Booking> {
  const res = await apiClient<ApiResponse<Booking>>("/api/bookings/court", {
    method: "POST",
    token,
    body: payload,
  });
  return res.data;
}

/** UC-13 coach: Đặt HLV */
export async function bookCoach(
  token: string,
  payload: CreateCoachBookingPayload
): Promise<Booking> {
  const res = await apiClient<ApiResponse<Booking>>("/api/bookings/coach", {
    method: "POST",
    token,
    body: payload,
  });
  return res.data;
}

/** UC-15: Đặt Combo (sân + HLV) */
export async function bookCombo(
  token: string,
  payload: CreateComboBookingPayload
): Promise<Booking> {
  const res = await apiClient<ApiResponse<Booking>>("/api/bookings/combo", {
    method: "POST",
    token,
    body: payload,
  });
  return res.data;
}

/** UC-19: Lịch sử booking của user */
export async function getMyBookings(token: string): Promise<Booking[]> {
  const res = await apiClient<ApiResponse<Booking[]>>("/api/bookings/my-bookings", {
    token,
  });
  return res.data;
}

/** Lấy chi tiết 1 booking */
export async function getBookingDetail(
  token: string,
  bookingId: number
): Promise<Booking> {
  const res = await apiClient<ApiResponse<Booking>>(
    `/api/bookings/detail?bookingId=${bookingId}`,
    { token }
  );
  return res.data;
}

/** UC-17: Hủy booking */
export async function cancelBooking(
  token: string,
  bookingId: number,
  cancelReason?: string
): Promise<CancelResult> {
  const res = await apiClient<ApiResponse<CancelResult>>(
    `/api/bookings/${bookingId}/cancel`,
    {
      method: "POST",
      token,
      body: { cancelReason },
    }
  );
  return res.data;
}

/** BR-54: Coach chủ động hủy booking */
export async function cancelBookingByCoach(
  token: string,
  bookingId: number
): Promise<CancelResult> {
  const res = await apiClient<ApiResponse<CancelResult>>(
    `/api/bookings/${bookingId}/coach-cancel`,
    {
      method: "POST",
      token,
    }
  );
  return res.data;
}

/** Mock payment (dev only) — trả về Confirmed */
export async function mockPayBooking(
  token: string,
  bookingId: number,
  paymentMethod: "VNPay" | "Momo" = "VNPay"
): Promise<MockPayResult> {
  const res = await apiClient<ApiResponse<MockPayResult>>(
    `/api/bookings/${bookingId}/mock-pay`,
    {
      method: "POST",
      token,
      body: { paymentMethod },
    }
  );
  return res.data;
}

/** UC-49: Staff/Admin lấy booking trong ngày */
export async function getDailyBookings(
  token: string,
  date?: string
): Promise<DailyBooking[]> {
  const url = date ? `/api/bookings/daily?date=${date}` : "/api/bookings/daily";
  const res = await apiClient<ApiResponse<DailyBooking[]>>(url, { token });
  return res.data;
}

/** BR-29: Check-in booking */
export async function checkInBooking(
  token: string,
  bookingId: number
): Promise<{ bookingId: number; status: string; checkInTime: string }> {
  const res = await apiClient<ApiResponse<{ bookingId: number; status: string; checkInTime: string }>>(
    `/api/bookings/${bookingId}/check-in`,
    {
      method: "POST",
      token,
    }
  );
  return res.data;
}

/**
 * UC-36: Đặt sân cho nhóm sau khi ghép thành công.
 * Cần groupId từ PlayerMatching/PlayGroups module.
 * Backend: POST /api/bookings/team
 */
export async function createTeamBooking(
  token: string,
  payload: {
    groupId: number;
    courtId: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
  }
): Promise<Booking> {
  const res = await apiClient<ApiResponse<Booking>>("/api/bookings/team", {
    method: "POST",
    token,
    body: payload,
  });
  return res.data;
}
