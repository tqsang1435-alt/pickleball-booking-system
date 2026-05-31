import { NextRequest } from "next/server";
import { getBookingDetailController } from "@/modules/bookings/bookings.module";

export async function GET(req: NextRequest) {
  return getBookingDetailController(req);
}
