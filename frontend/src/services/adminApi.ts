import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";

export type DashboardStats = {
  todayRevenue: number;
  todayBookingsCount: number;
  activeCourts: number;
  totalCourts: number;
  activeCoaches: number;
  activeStaff: number;
  activeCombos: number;
  activePromotions?: number;
  latestBookings: {
    BookingCode: string;
    PlayerName: string;
    PlayerEmail: string | null;
    PlayerPhone: string | null;
    ServiceType: string;
    CourtName: string | null;
    CoachName: string | null;
    StartTime: string | null;
    EndTime: string | null;
    Status: string;
    CreatedAt: string;
  }[];
};

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const res = await apiClient<ApiResponse<DashboardStats>>("/api/admin/dashboard", {
    token,
  });
  return res.data;
}
