import { NextRequest } from "next/server";
import { createCoachBookingController } from "@/modules/bookings/bookings.controller";

export async function POST(req: NextRequest) {
  return createCoachBookingController(req);
}