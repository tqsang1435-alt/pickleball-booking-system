import { NextRequest } from "next/server";
import { getScheduleOptionsController } from "@/modules/coaches/coaches.controller";

/**
 * GET /api/coaches/me/schedule-options?date=YYYY-MM-DD
 * Lay thong tin lua chon lich hop le cho Coach (Role: Coach)
 */
export async function GET(req: NextRequest) {
  return getScheduleOptionsController(req);
}
