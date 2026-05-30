import { NextRequest } from "next/server";
import { updateCoachStatusController } from "@/modules/coaches/coaches.controller";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ coachId: string }> }
) {
  return updateCoachStatusController(req, context);
}
