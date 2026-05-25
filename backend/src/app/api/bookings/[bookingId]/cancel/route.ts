import { NextRequest } from "next/server";

import {
  cancelBookingController,
} from "@/modules/bookings/bookings.controller";

type RouteParams = {
  params: Promise<{
    bookingId: string;
  }>;
};

export async function PATCH(
  _req: NextRequest,
  { params }: RouteParams
) {
  const { bookingId } = await params;

  return cancelBookingController(Number(bookingId));
}