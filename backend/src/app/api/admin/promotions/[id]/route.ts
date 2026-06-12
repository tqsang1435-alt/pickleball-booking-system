import type { NextRequest } from "next/server";
import {
  adminGetPromotionDetailController,
  adminUpdatePromotionController,
} from "@/modules/promotions/promotions.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminGetPromotionDetailController(req, Number(id));
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminUpdatePromotionController(req, Number(id));
}
