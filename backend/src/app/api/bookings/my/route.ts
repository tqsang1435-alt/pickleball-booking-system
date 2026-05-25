import { NextRequest } from "next/server";
import { getMyBookingsController } from "@/modules/bookings/bookings.controller";

export async function GET(req: NextRequest) {
  return getMyBookingsController(req);
}