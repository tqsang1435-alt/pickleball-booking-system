import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Coach, CoachSchedule, CoachStatus } from "@/types/coach";

// ─── PUBLIC ───────────────────────────────────────────────────

export type CoachFilter = {
  skillLevel?: string;
  specialization?: string;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
};

export async function getCoaches(filter: CoachFilter = {}): Promise<Coach[]> {
  const params = new URLSearchParams();
  if (filter.skillLevel) params.set("skillLevel", filter.skillLevel);
  if (filter.specialization) params.set("specialization", filter.specialization);
  if (filter.minRate !== undefined) params.set("minRate", String(filter.minRate));
  if (filter.maxRate !== undefined) params.set("maxRate", String(filter.maxRate));
  if (filter.minRating !== undefined) params.set("minRating", String(filter.minRating));

  const qs = params.toString();
  const response = await apiClient<ApiResponse<Coach[]>>(
    `/api/coaches${qs ? `?${qs}` : ""}`
  );
  return response.data;
}

export async function getCoachById(id: number | string): Promise<Coach> {
  const response = await apiClient<ApiResponse<Coach>>(`/api/coaches/${id}`);
  return response.data;
}

export async function getCoachSchedulesPublic(
  id: number | string,
  date: string
): Promise<CoachSchedule[]> {
  const response = await apiClient<ApiResponse<CoachSchedule[]>>(
    `/api/coaches/${id}/schedules?date=${date}`
  );
  return response.data;
}

// ─── AUTH COACH ───────────────────────────────────────────────

export async function getMyCoachProfile(token: string): Promise<Coach> {
  const response = await apiClient<ApiResponse<Coach>>("/api/coaches/me", {
    token,
  });
  return response.data;
}

export async function updateMyProfile(
  token: string,
  payload: FormData | {
    experienceYears?: number;
    biography?: string | null;
    specialization?: string | null;
  }
): Promise<Partial<Coach>> {
  const response = await apiClient<ApiResponse<Partial<Coach>>>(
    "/api/coaches/me/profile",
    { method: "PUT", token, body: payload }
  );
  return response.data;
}

export async function updateMyExpertise(
  token: string,
  payload: FormData | {
    skillLevel?: string;
    specialization?: string | null;
    certifications?: string | null;
    experienceYears?: number;
  }
): Promise<Partial<Coach>> {
  const response = await apiClient<ApiResponse<Partial<Coach>>>(
    "/api/coaches/me/expertise",
    { method: "PUT", token, body: payload }
  );
  return response.data;
}

export async function updateMyTeachingFee(
  token: string,
  hourlyRate: number
): Promise<Partial<Coach>> {
  const response = await apiClient<ApiResponse<Partial<Coach>>>(
    "/api/coaches/me/teaching-fee",
    { method: "PUT", token, body: { hourlyRate } }
  );
  return response.data;
}

// ─── SCHEDULES ────────────────────────────────────────────────

export async function getMySchedules(token: string): Promise<CoachSchedule[]> {
  const response = await apiClient<ApiResponse<CoachSchedule[]>>(
    "/api/coaches/me/schedules",
    { token }
  );
  return response.data;
}

export async function getScheduleOptions(token: string, date: string): Promise<{ date: string; startTimes: string[]; occupiedHours: number[] }> {
  const response = await apiClient<ApiResponse<{ date: string; startTimes: string[]; occupiedHours: number[] }>>(
    `/api/coaches/me/schedule-options?date=${date}`,
    { token }
  );
  return response.data;
}

export async function createMySchedule(
  token: string,
  payload: { workingDate: string; startTime: string; endTime: string }
): Promise<CoachSchedule[]> {
  const response = await apiClient<ApiResponse<CoachSchedule[]>>(
    "/api/coaches/me/schedules",
    { method: "POST", token, body: payload }
  );
  return response.data;
}

export async function updateMySchedule(
  token: string,
  scheduleId: number,
  payload: {
    workingDate?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
  }
): Promise<CoachSchedule> {
  const response = await apiClient<ApiResponse<CoachSchedule>>(
    `/api/coaches/me/schedules/${scheduleId}`,
    { method: "PUT", token, body: payload }
  );
  return response.data;
}

export async function deleteMySchedule(
  token: string,
  scheduleId: number
): Promise<{ CoachScheduleID: number; Status: string }> {
  const response = await apiClient<
    ApiResponse<{ CoachScheduleID: number; Status: string }>
  >(`/api/coaches/me/schedules/${scheduleId}`, {
    method: "DELETE",
    token,
  });
  return response.data;
}

export async function getMyReceivedBookings(token: string): Promise<any[]> {
  const response = await apiClient<ApiResponse<any[]>>(
    "/api/coaches/me/bookings",
    { token }
  );
  return response.data;
}

export async function getMyIncome(token: string): Promise<{
  summary: {
    totalSessions: number;
    completedSessions: number;
    totalWorkingHours: number;
    totalIncome: number;
  };
  monthlyIncome: {
    month: string;
    sessions: number;
    workingHours: number;
    income: number;
  }[];
  sessions: {
    bookingId: number;
    bookingType: string;
    playerName: string;
    workingDate: string;
    startTime: string;
    endTime: string;
    workingHours: number;
    coachFee: number;
    status: string;
    paymentStatus: string;
  }[];
}> {
  const response = await apiClient<ApiResponse<any>>(
    "/api/coaches/me/income",
    { token }
  );
  return response.data;
}

// ─── ADMIN ────────────────────────────────────────────────────

export async function adminGetAllCoaches(token: string): Promise<Coach[]> {
  const response = await apiClient<ApiResponse<Coach[]>>(
    "/api/admin/coaches",
    { token }
  );
  return response.data;
}

export async function adminGetPendingCoaches(token: string): Promise<Coach[]> {
  const response = await apiClient<ApiResponse<Coach[]>>(
    "/api/admin/coaches/pending",
    { token }
  );
  return response.data;
}

export async function adminUpdateCoachStatus(
  token: string,
  coachId: number,
  status: CoachStatus
): Promise<{ CoachID: number; Status: string; UpdatedAt: string }> {
  const response = await apiClient<
    ApiResponse<{ CoachID: number; Status: string; UpdatedAt: string }>
  >(`/api/admin/coaches/${coachId}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
  return response.data;
}

export async function adminCreateCoach(
  token: string,
  payload: {
    fullName: string;
    email: string;
    phone?: string;
    password?: string;
    experience: number;
    skillLevel?: string;
    specialty?: string;
    certificate?: string;
    hourlyRate: number;
    bio?: string;
    avatarUrl?: string;
  }
): Promise<number> {
  const response = await apiClient<ApiResponse<number>>(
    "/api/admin/coaches",
    {
      method: "POST",
      token,
      body: payload,
    }
  );
  return response.data;
}
