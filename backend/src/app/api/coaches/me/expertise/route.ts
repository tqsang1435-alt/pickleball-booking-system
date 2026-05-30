import { NextRequest } from "next/server";
import { updateMyExpertiseController } from "@/modules/coaches/coaches.controller";

export async function PUT(req: NextRequest) {
  return updateMyExpertiseController(req);
}
