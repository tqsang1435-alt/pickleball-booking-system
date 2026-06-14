import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type {
  ApiSuccessResponse,
  ExportReportPayload,
  ExportReportResult,
  ReportHistoryItem,
} from "@/types/report.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

function getFilenameFromHeader(contentDisposition: string | null): string {
  if (!contentDisposition) return "report";
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try { return decodeURIComponent(utf8Match[1]); } catch { return utf8Match[1]; }
  }
  const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return normalMatch?.[1] ?? "report";
}

/**
 * Gọi API xuất báo cáo - trả về Blob để tải file.
 * Dùng fetch thẳng vì cần xử lý binary response.
 */
export async function exportAdminReport(
  input: ExportReportPayload
): Promise<ExportReportResult> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/admin/reports/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = `Yêu cầu thất bại với mã ${response.status}`;
    try {
      const json = await response.json();
      message = json?.message ?? message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = getFilenameFromHeader(
    response.headers.get("Content-Disposition")
  );

  return { blob, filename };
}

/**
 * Lấy lịch sử xuất báo cáo - dùng apiClient chuẩn.
 */
export async function getAdminReportHistory(
  limit = 50
): Promise<ReportHistoryItem[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const token = getToken();

  const result = await apiClient<ApiSuccessResponse<ReportHistoryItem[]>>(
    `/api/admin/reports/history?limit=${safeLimit}`,
    { token }
  );

  return result.data;
}
