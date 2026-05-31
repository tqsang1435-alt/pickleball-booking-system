import { NextRequest } from "next/server";
import { checkInController } from "@/modules/bookings/bookings.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  return checkInController(req, Number(bookingId));
}
