import { NextRequest } from "next/server";
import {
  getCoachSchedulesController,
  createCoachScheduleController,
} from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getCoachSchedulesController(req);
}

export async function POST(req: NextRequest) {
  return createCoachScheduleController(req);
}