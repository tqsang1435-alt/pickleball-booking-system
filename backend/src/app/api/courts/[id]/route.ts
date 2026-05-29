import { NextRequest } from "next/server";
import { getCourtByIdController, updateCourtController, deleteCourtController } from "@/modules/courts/courts.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getCourtByIdController(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateCourtController(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return deleteCourtController(req, context);
}