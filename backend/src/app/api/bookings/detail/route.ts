import { NextRequest } from "next/server";
import { getBookingDetailController } from "@/modules/bookings/bookings.controller";

export async function GET(req: NextRequest) {
  return getBookingDetailController(req);
}
