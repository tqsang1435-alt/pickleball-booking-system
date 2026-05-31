import { NextRequest } from "next/server";
import { createComboBookingController } from "@/modules/bookings/bookings.module";

export async function POST(req: NextRequest) {
  return createComboBookingController(req);
}
