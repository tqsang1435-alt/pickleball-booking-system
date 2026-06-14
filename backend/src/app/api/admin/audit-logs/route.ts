import { NextRequest } from "next/server";
import { getLogsController } from "@/modules/systemlogs/systemlogs.controller";

/**
 * GET /api/admin/audit-logs
 * Lấy danh sách audit logs
 */
export async function GET(req: NextRequest) {
  return getLogsController(req);
}
