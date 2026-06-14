// systemlogs.controller.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/users/logs
 * Trả về danh sách system logs
 */
export async function getLogsController(req: NextRequest) {
  try {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message ?? "Lỗi server" }, { status: 500 });
  }
}
