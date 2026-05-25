import { NextRequest } from "next/server";
import { getAvailableCoachSchedulesController } from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getAvailableCoachSchedulesController(req);
}