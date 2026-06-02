import { NextRequest } from "next/server";
import { getCoachReceivedBookingsController } from "@/modules/bookings/bookings.controller";

/**
 * GET /api/coaches/me/bookings
 * Lay danh sach booking ma HLV nay da nhan duoc (Role: Coach)
 */
export async function GET(req: NextRequest) {
  return getCoachReceivedBookingsController(req);
}
