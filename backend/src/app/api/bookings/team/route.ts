import { NextRequest } from "next/server";
import { createTeamBookingController } from "@/modules/bookings/bookings.module";

/**
 * UC-36: Dat san sau khi ghep nhom thanh cong.
 * POST /api/bookings/team
 *
 * Body: { groupId, courtId, bookingDate, startTime, endTime }
 *
 * Flow:
 * 1. PlayerMatching module ghep nhom thanh cong → tao PlayGroup voi Status = 'Matched'
 * 2. Leader cua nhom goi endpoint nay de dat san cho ca nhom
 * 3. Booking duoc tao voi BookingCode prefix 'TM-'
 *
 * TODO: Sau khi PlayGroups module implement, validate group status o service layer.
 */
export async function POST(req: NextRequest) {
  return createTeamBookingController(req);
}
