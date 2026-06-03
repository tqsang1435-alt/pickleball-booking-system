import { NextRequest } from "next/server";
import { leavePlayGroupController } from "@/modules/playgroups/playgroups.controller";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return leavePlayGroupController(req, Number(id));
}
