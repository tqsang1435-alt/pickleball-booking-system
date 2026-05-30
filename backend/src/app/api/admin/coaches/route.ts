import { NextRequest } from "next/server";
import { getAllCoachesAdminController } from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getAllCoachesAdminController(req);
}
