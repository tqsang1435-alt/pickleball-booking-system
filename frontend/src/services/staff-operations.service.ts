import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { DailyBookingItem, BookingDetailView, BookingStatus } from "@/types/staff.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Map PascalCase API response to camelCase DailyBookingItem
function mapDailyBooking(row: any): DailyBookingItem {
  const now = new Date();
  const bookingDate = row.BookingDate || row.bookingDate;
  const startTime = row.StartTime || row.startTime;
  const endTime = row.EndTime || row.endTime;
  const status: BookingStatus = row.Status || row.status;

  let canCheckIn = false;
  let canMarkNoShow = false;
  let canComplete = false;

  if (bookingDate && startTime) {
    const startDateTime = new Date(`${String(bookingDate).split('T')[0]}T${startTime}:00`);
    const diffMs = startDateTime.getTime() - now.getTime();
    const diffMinutes = diffMs / 60000;

    if (status === 'Confirmed') {
      canCheckIn = Math.abs(diffMinutes) <= 15;
      canMarkNoShow = diffMinutes < -15;
    }
  }

  if (bookingDate && endTime) {
    const endDateTime = new Date(`${String(bookingDate).split('T')[0]}T${endTime}:00`);
    if (status === 'CheckedIn' && endDateTime < now) {
      canComplete = true;
    }
  }

  return {
    bookingId: row.BookingID ?? row.bookingId,
    bookingCode: row.BookingCode ?? row.bookingCode,
    bookingType: row.BookingType ?? row.bookingType ?? 'Court',
    customerName: row.PlayerName ?? row.GuestName ?? row.customerName ?? 'Khách vãng lai',
    customerEmail: row.PlayerEmail ?? row.customerEmail ?? '',
    customerPhone: row.PlayerPhone ?? row.customerPhone ?? null,
    courtName: row.CourtName ?? row.courtName ?? null,
    coachName: row.CoachName ?? row.coachName ?? null,
    bookingDate: String(bookingDate ?? '').split('T')[0],
    startTime: startTime ?? '',
    endTime: endTime ?? '',
    totalAmount: Number(row.TotalAmount ?? row.totalAmount ?? 0),
    status,
    checkInTime: row.CheckInTime ?? row.checkInTime ?? null,
    paymentMethod: row.PaymentMethod ?? row.paymentMethod ?? null,
    paymentStatus: row.PaymentStatus ?? row.paymentStatus ?? null,
    isGuest: !!(row.GuestName ?? row.guestName),
    guestName: row.GuestName ?? row.guestName,
    guestPhone: row.GuestPhone ?? row.guestPhone,
    canCheckIn,
    canMarkNoShow,
    canComplete,
  };
}

export async function getDailyBookings(date: string): Promise<DailyBookingItem[]> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any[]>>(
    `/api/bookings/daily?date=${date}`,
    { token }
  );
  return (result.data ?? []).map(mapDailyBooking);
}

export async function checkInBooking(bookingId: number): Promise<{ status: string; checkInTime: string }> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any>>(
    `/api/bookings/${bookingId}/check-in`,
    { method: "POST", token }
  );
  return result.data;
}

export async function markBookingNoShow(bookingId: number): Promise<{ bookingId: number; status: string }> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any>>(
    `/api/staff/bookings/${bookingId}/no-show`,
    { method: "POST", token }
  );
  return result.data;
}

export async function markBookingCompleted(bookingId: number): Promise<{ bookingId: number; status: string }> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any>>(
    `/api/staff/bookings/${bookingId}/complete`,
    { method: "POST", token }
  );
  return result.data;
}

export async function getBookingDetails(bookingId: number): Promise<BookingDetailView> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any>>(
    `/api/bookings?bookingId=${bookingId}`,
    { token }
  );
  const row = result.data;
  return {
    bookingId: row.BookingID ?? row.bookingId,
    bookingCode: row.BookingCode ?? row.bookingCode,
    customerName: row.PlayerName ?? row.GuestName ?? 'Khách vãng lai',
    customerEmail: row.PlayerEmail ?? row.Email ?? '',
    customerPhone: row.PlayerPhone ?? row.PhoneNumber ?? null,
    courtName: row.CourtName ?? null,
    coachName: row.CoachName ?? null,
    bookingDate: String(row.BookingDate ?? '').split('T')[0],
    startTime: row.StartTime ?? '',
    endTime: row.EndTime ?? '',
    totalAmount: Number(row.TotalAmount ?? 0),
    courtFee: Number(row.CourtFee ?? 0),
    coachFee: Number(row.CoachFee ?? 0),
    discountAmount: Number(row.DiscountAmount ?? 0),
    status: row.Status ?? row.status,
    paymentMethod: row.PaymentMethod ?? null,
    paymentStatus: row.PaymentStatus ?? null,
    checkInTime: row.CheckInTime ?? null,
    cancelledAt: row.CancelledAt ?? null,
    cancelReason: row.CancelReason ?? null,
    createdAt: row.CreatedAt ?? '',
    isGuest: !!(row.GuestName),
    guestName: row.GuestName,
    guestPhone: row.GuestPhone,
  };
}
