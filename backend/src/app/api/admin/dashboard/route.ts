import { NextRequest } from "next/server";
import { getDashboardStatsController } from "@/modules/reports/reports.controller";

export async function GET(req: NextRequest) {
  return getDashboardStatsController(req);
}
