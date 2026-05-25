import { NextRequest } from "next/server";
import { getCoachByIdController } from "@/modules/coaches/coaches.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getCoachByIdController(req, context);
}