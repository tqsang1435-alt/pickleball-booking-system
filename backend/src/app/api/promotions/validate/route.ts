import type { NextRequest } from "next/server";
import { validatePromotionController } from "@/modules/promotions/promotions.controller";

export async function POST(req: NextRequest) {
  return validatePromotionController(req);
}
