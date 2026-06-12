import type { NextRequest } from "next/server";
import { adminUpdateStatusController } from "@/modules/promotions/promotions.controller";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return adminUpdateStatusController(req, Number(id));
}
