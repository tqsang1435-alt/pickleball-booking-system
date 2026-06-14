import type { NextRequest } from "next/server";
import { markBookingCompletedController } from "@/modules/staff/staff.controller";

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return markBookingCompletedController(req, Number(bookingId));
}
