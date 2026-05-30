import { NextRequest } from "next/server";
import {
  updateMyScheduleController,
  deleteMyScheduleController,
} from "@/modules/coaches/coaches.controller";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> }
) {
  return updateMyScheduleController(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> }
) {
  return deleteMyScheduleController(req, context);
}
