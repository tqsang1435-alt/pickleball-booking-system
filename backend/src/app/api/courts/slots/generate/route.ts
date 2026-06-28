import { NextRequest } from "next/server";
import { generateCourtSlotsController } from "@/modules/courts/courts.controller";

/**
 * POST /api/courts/slots/generate
 * UC-62: Sinh slot hàng loạt theo thời lượng từ giờ mở -> giờ đóng cửa.
 * Yêu cầu: Role Admin hoặc Staff.
 *
 * Body: { courtId, slotDate, durationMinutes, price }
 */
export async function POST(req: NextRequest) {
  return generateCourtSlotsController(req);
}
