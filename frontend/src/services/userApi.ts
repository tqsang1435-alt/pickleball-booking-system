import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";

export async function adminGetAllStaff(token: string): Promise<any[]> {
  const response = await apiClient<ApiResponse<any[]>>("/api/admin/staff", {
    token,
  });
  return response.data;
}

export async function adminCreateStaff(
  token: string,
  payload: {
    fullName: string;
    email: string;
    phone?: string;
    password?: string;
  }
): Promise<number> {
  const response = await apiClient<ApiResponse<number>>(
    "/api/admin/staff",
    {
      method: "POST",
      token,
      body: payload,
    }
  );
  return response.data;
}

export async function adminUpdateUser(
  token: string,
  userId: number,
  payload: {
    fullName: string;
    phoneNumber?: string;
  }
): Promise<any> {
  const response = await apiClient<ApiResponse<any>>(
    `/api/admin/users/${userId}`,
    {
      method: "PATCH",
      token,
      body: payload,
    }
  );
  return response.data;
}
