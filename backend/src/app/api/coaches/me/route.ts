import { NextRequest } from "next/server";
import { getMyCoachProfileController } from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getMyCoachProfileController(req);
}
