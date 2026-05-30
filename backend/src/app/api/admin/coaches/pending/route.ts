import { NextRequest } from "next/server";
import { getPendingCoachesController } from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getPendingCoachesController(req);
}
