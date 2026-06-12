import type { NextRequest } from "next/server";
import {
  adminAssignUsersController,
  adminGetPromotionUsersController,
} from "@/modules/promotions/promotions.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminGetPromotionUsersController(req, Number(id));
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminAssignUsersController(req, Number(id));
}
