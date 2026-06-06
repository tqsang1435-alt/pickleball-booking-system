import { NextRequest } from "next/server";
import { checkInOperationController } from "@/modules/operations/operations.controller";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  return checkInOperationController(req, Number(bookingId));
}
