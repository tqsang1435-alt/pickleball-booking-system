import type { NextRequest } from "next/server";
import {
  adminGetPromotionsController,
  adminCreatePromotionController,
} from "@/modules/promotions/promotions.controller";

export async function GET(req: NextRequest) {
  return adminGetPromotionsController(req);
}

export async function POST(req: NextRequest) {
  return adminCreatePromotionController(req);
}
