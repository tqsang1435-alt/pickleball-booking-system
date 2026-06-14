import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { StaffDashboardStats } from "@/types/staff.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getDashboardStats(): Promise<StaffDashboardStats> {
  const token = getToken();
  const result = await apiClient<ApiResponse<StaffDashboardStats>>(
    "/api/staff/dashboard/stats",
    { token }
  );
  return result.data;
}
