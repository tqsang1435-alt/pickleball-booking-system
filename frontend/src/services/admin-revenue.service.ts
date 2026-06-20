// frontend/src/services/admin-revenue.service.ts

import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { ApiSuccessResponse } from "@/types/report.types";
import type {
  RevenueFilterParams,
  RevenueResponse,
} from "@/types/revenue.types";

export async function getAdminRevenue(
  params?: RevenueFilterParams
): Promise<RevenueResponse> {
  const query =
    new URLSearchParams();

  if (params?.fromDate) {
    query.append(
      "fromDate",
      params.fromDate
    );
  }

  if (params?.toDate) {
    query.append(
      "toDate",
      params.toDate
    );
  }

  if (params?.serviceType) {
    query.append(
      "serviceType",
      params.serviceType
    );
  }

  const endpoint =
    query.toString()
      ? `/api/admin/revenue?${query.toString()}`
      : "/api/admin/revenue";

  const result =
    await apiClient<
      ApiSuccessResponse<RevenueResponse>
    >(endpoint, {
      token:
        getToken(),
    });

  return result.data;
}
