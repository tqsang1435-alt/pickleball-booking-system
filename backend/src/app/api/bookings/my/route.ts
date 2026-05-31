import { NextRequest } from "next/server";
import { getMyBookingsController } from "@/modules/bookings/bookings.module";

export async function GET(req: NextRequest) {
  return getMyBookingsController(req);
}
