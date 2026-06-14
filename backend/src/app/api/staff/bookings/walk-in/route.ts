import type { NextRequest } from "next/server";
import { createStaffWalkInBookingController } from "@/modules/bookings/bookings.controller";

export async function POST(req: NextRequest) {
  return createStaffWalkInBookingController(req);
}
