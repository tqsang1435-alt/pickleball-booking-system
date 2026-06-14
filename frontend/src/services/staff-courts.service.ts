import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { CourtStatusItem } from "@/types/staff.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getCourtStatusBoard(): Promise<CourtStatusItem[]> {
  const token = getToken();
  const result = await apiClient<ApiResponse<CourtStatusItem[]>>(
    "/api/staff/courts/status",
    { token }
  );
  return result.data ?? [];
}
