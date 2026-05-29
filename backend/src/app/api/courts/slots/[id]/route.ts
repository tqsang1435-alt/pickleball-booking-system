import { NextRequest } from "next/server";
import { updateCourtSlotStatusController, deleteCourtSlotController } from "@/modules/courts/courts.controller";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateCourtSlotStatusController(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return deleteCourtSlotController(req, context);
}

