import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type {
  BookingHistory,
  Profile,
  UpdateProfilePayload,
} from "@/types/profile";

export async function getMyProfile(token: string): Promise<Profile> {
  const response = await apiClient<ApiResponse<Profile>>("/api/users/me", {
    token,
  });

  return response.data;
}

export async function updateMyProfile(
  token: string,
  payload: UpdateProfilePayload
): Promise<Profile> {
  const response = await apiClient<ApiResponse<Profile>>("/api/users/me", {
    method: "PUT",
    token,
    body: payload,
  });

  return response.data;
}

export async function getMyBookingHistory(
  token: string
): Promise<BookingHistory[]> {
  const response = await apiClient<ApiResponse<BookingHistory[]>>(
    "/api/bookings/my",
    {
      token,
    }
  );

  return response.data;
}