import type { NextRequest } from "next/server";
import { getMyPromotionsController } from "@/modules/promotions/promotions.controller";

export async function GET(req: NextRequest) {
  return getMyPromotionsController(req);
}
