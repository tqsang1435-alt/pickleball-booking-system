import { NextRequest } from "next/server";
import { closePlayGroupController } from "@/modules/playgroups/playgroups.controller";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return closePlayGroupController(req, Number(id));
}
