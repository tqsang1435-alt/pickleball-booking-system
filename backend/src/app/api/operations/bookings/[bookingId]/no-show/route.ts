import { NextRequest } from "next/server";
import { noShowOperationController } from "@/modules/operations/operations.controller";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  return noShowOperationController(req, Number(bookingId));
}
