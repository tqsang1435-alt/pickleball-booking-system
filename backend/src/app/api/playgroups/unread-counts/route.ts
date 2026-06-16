import { NextRequest } from "next/server";
import { getUnreadCountsController } from "@/modules/playgroups/playgroups.controller";

export async function GET(req: NextRequest) {
  return getUnreadCountsController(req);
}
