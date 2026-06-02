import { NextRequest } from "next/server";
import { createComboBookingController } from "@/modules/bookings/bookings.controller";

export async function POST(req: NextRequest) {
  return createComboBookingController(req);
}
