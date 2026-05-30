import { NextRequest } from "next/server";
import {
  getMySchedulesController,
  createMyScheduleController,
} from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getMySchedulesController(req);
}

export async function POST(req: NextRequest) {
  return createMyScheduleController(req);
}
