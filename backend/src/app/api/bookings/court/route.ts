import { NextRequest } from "next/server";
import { createCourtBookingController } from "@/modules/bookings/bookings.module";

export async function POST(req: NextRequest) {
  return createCourtBookingController(req);
}
