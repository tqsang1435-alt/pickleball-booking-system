import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";

export type DashboardStats = {
  todayRevenue: number;
  todayBookingsCount: number;
  activeCourts: number;
  totalCourts: number;
  activeCoaches: number;
  activeCombos: number;
  activePromotions: number;
  latestBookings: Array<{
    BookingCode: string;
    PlayerName: string;
    CourtName: string;
    StartTime: string | null;
    Status: string;
  }>;
};

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const res = await apiClient<ApiResponse<DashboardStats>>("/api/admin/dashboard", {
    token,
  });
  return res.data;
}
