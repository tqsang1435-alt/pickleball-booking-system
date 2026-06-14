import { NextRequest } from "next/server";
import { createBackupController } from "@/modules/maintenance/maintenance.controller";

/**
 * POST /api/admin/maintenance/backup
 * Tạo backup database
 */
export async function POST(req: NextRequest) {
  return createBackupController(req);
}
