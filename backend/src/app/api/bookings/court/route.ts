import { NextRequest } from "next/server";
// Force recompile
import { createCourtBookingController } from "@/modules/bookings/bookings.controller";

export async function POST(req: NextRequest) {
  return createCourtBookingController(req);
}
