import { NextRequest } from "next/server";
import { releaseExpiredController } from "@/modules/bookings/bookings.module";

/**
 * BR-26: Auto-cancel booking Holding qua 10 phut.
 * BR-31: Auto mark No-show booking Confirmed qua 15 phut sau gio bat dau.
 *
 * Goi endpoint nay bang cron job dinh ky (vd: moi 5 phut).
 * Trong production nen bao ve bang API key.
 */
export async function POST(req: NextRequest) {
  return releaseExpiredController(req);
}
