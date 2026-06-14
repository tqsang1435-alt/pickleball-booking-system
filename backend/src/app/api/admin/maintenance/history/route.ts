import { NextRequest } from "next/server";
import { getBackupHistoryController } from "@/modules/maintenance/maintenance.controller";

/**
 * GET /api/admin/maintenance/history
 * Lấy danh sách lịch sử backup
 */
export async function GET(req: NextRequest) {
  return getBackupHistoryController(req);
}
