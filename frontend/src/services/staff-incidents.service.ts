import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { IncidentReport, CreateIncidentReportRequest } from "@/types/staff.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function createIncidentReport(payload: CreateIncidentReportRequest): Promise<{ incidentId: number }> {
  const token = getToken();
  const result = await apiClient<ApiResponse<{ incidentId: number }>>(
    "/api/staff/incidents",
    { method: "POST", token, body: payload }
  );
  return result.data;
}

export async function getMyIncidents(): Promise<IncidentReport[]> {
  const token = getToken();
  const result = await apiClient<ApiResponse<any[]>>(
    "/api/staff/incidents",
    { token }
  );
  return (result.data ?? []).map((item: any) => ({
    incidentId: item.incidentId,
    courtId: item.courtId,
    courtName: item.courtName,
    incidentType: item.incidentType,
    description: item.description,
    urgency: item.urgency,
    status: item.status,
    createdAt: item.createdAt,
    staffName: item.staffName,
  }));
}
