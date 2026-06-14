import type { NextRequest } from "next/server";
import { adminRevokeUserController } from "@/modules/promotions/promotions.controller";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await context.params;
  return adminRevokeUserController(req, Number(id), Number(userId));
}
