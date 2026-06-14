import type { NextRequest } from "next/server";
import { getCourtStatusBoardController } from "@/modules/staff/staff.controller";

export async function GET(req: NextRequest) {
  return getCourtStatusBoardController(req);
}
