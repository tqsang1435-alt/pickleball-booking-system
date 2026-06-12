import type { NextRequest } from "next/server";
import { removePromotionController } from "@/modules/promotions/promotions.controller";

export async function DELETE(req: NextRequest) {
  return removePromotionController(req);
}
