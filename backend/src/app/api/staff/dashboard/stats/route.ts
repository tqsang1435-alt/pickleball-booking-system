import type { NextRequest } from "next/server";
import { getStaffDashboardStatsController } from "@/modules/staff/staff.controller";

export async function GET(req: NextRequest) {
  return getStaffDashboardStatsController(req);
}
