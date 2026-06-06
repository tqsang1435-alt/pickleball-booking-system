import { NextRequest } from "next/server";
import { completeOperationController } from "@/modules/operations/operations.controller";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  return completeOperationController(req, Number(bookingId));
}
