import { NextRequest } from "next/server";
import { cancelBookingByCoachController } from "@/modules/bookings/bookings.controller";

/**
 * BR-54: Coach chu dong huy booking Confirmed.
 * Player se duoc hoan 100% trong 24 gio va nhan notification ngay.
 *
 * Chi Coach/Admin moi duoc goi (kiem tra trong controller).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  return cancelBookingByCoachController(req, Number(bookingId));
}

