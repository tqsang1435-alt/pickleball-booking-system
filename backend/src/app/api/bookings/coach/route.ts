import { NextRequest } from "next/server";
import { createCoachBookingController } from "@/modules/bookings/bookings.module";

export async function POST(req: NextRequest) {
  return createCoachBookingController(req);
}
