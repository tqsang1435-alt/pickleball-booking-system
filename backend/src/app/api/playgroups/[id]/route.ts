import { NextRequest } from "next/server";
import {
  getPlayGroupDetailsController,
  updatePlayGroupController,
} from "@/modules/playgroups/playgroups.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return getPlayGroupDetailsController(req, Number(id));
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updatePlayGroupController(req, Number(id));
}
