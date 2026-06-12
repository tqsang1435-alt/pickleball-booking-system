import type { NextRequest } from "next/server";
import { applyPromotionController } from "@/modules/promotions/promotions.controller";

export async function POST(req: NextRequest) {
  return applyPromotionController(req);
}
