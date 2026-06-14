import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { CustomerSearchResult, CourtAvailability, WalkInBookingRequest, WalkInBookingResponse } from "@/types/staff-booking.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any[]>>(
    `/api/users/search?query=${encodeURIComponent(query)}`,
    { token }
  );
  return (result.data ?? []).map((u: any) => ({
    userId: u.userId ?? u.UserID,
    fullName: u.fullName ?? u.FullName,
    email: u.email ?? u.Email,
    phone: u.phone ?? u.PhoneNumber,
  }));
}

export async function getAvailableCourts(date: string): Promise<CourtAvailability[]> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any[]>>(
    `/api/courts?date=${date}`,
    { token }
  );
  return (result.data ?? []).map((c: any) => ({
    courtId: c.CourtID ?? c.courtId,
    courtName: c.CourtName ?? c.courtName,
    courtCode: c.CourtCode ?? c.courtCode,
    courtImage: c.CourtImage ?? c.courtImage ?? null,
    location: c.Location ?? c.location ?? null,
    status: c.Status ?? c.status ?? 'Active',
    hourlyRate: Number(c.PricePerHour ?? c.HourlyRate ?? c.hourlyRate ?? 0),
    hasAvailability: c.hasAvailability !== false,
  }));
}

export async function getAvailableTimeSlots(courtId: number, date: string): Promise<any[]> {
  const token = getToken();
  try {
    const result = await apiClient<ApiResponse<any[]>>(
      `/api/courts/${courtId}/slots?date=${date}`,
      { token }
    );
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function createWalkInBooking(payload: WalkInBookingRequest): Promise<WalkInBookingResponse> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any>>(
    "/api/staff/bookings/walk-in",
    { method: "POST", token, body: payload }
  );
  const d = result.data;
  return {
    bookingId: d.BookingID ?? d.bookingId,
    bookingCode: d.BookingCode ?? d.bookingCode,
    status: d.Status ?? d.status,
    totalAmount: Number(d.TotalAmount ?? d.totalAmount ?? 0),
    paymentMethod: d.PaymentMethod ?? d.paymentMethod,
    createdAt: d.CreatedAt ?? d.createdAt ?? new Date().toISOString(),
  };
}
