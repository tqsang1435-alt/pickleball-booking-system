import { NextRequest } from "next/server";
import { getAllCoachesController } from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getAllCoachesController(req);
}