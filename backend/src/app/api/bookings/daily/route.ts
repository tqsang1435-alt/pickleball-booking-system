import { NextRequest } from "next/server";
import { getDailyBookingsController } from "@/modules/bookings/bookings.controller";

/**
 * UC-49: Staff xem booking trong ngay.
 * Chi Admin/Staff moi co quyen truy cap (kiem tra trong controller).
 *
 * Query params:
 * - date (optional): YYYY-MM-DD, mac dinh la hom nay
 *
 * Example: GET /api/bookings/daily?date=2026-05-30
 */
export async function GET(req: NextRequest) {
  return getDailyBookingsController(req);
}
