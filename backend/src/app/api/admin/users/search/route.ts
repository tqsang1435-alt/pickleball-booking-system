import type { NextRequest } from "next/server";
import { adminSearchUsersController } from "@/modules/promotions/promotions.controller";

export async function GET(req: NextRequest) {
  return adminSearchUsersController(req);
}
