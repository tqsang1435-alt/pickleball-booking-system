import { NextRequest } from "next/server";
import { getBookingLogsController } from "@/modules/operations/operations.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const id = parseInt(bookingId, 10);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ success: false, message: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  return getBookingLogsController(req, id);
}
