import { NextRequest } from "next/server";
import { getCourtByIdController } from "@/modules/courts/courts.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getCourtByIdController(req, context);
}