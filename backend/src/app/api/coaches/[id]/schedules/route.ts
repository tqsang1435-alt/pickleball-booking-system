import { NextRequest } from "next/server";
import { getCoachSchedulesPublicController } from "@/modules/coaches/coaches.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getCoachSchedulesPublicController(req, context);
}
