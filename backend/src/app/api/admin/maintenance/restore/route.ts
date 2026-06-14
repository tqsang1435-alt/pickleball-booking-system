import { NextRequest } from "next/server";
import { restoreBackupController } from "@/modules/maintenance/maintenance.controller";

/**
 * POST /api/admin/maintenance/restore
 * Khôi phục database từ backup
 */
export async function POST(req: NextRequest) {
  return restoreBackupController(req);
}
