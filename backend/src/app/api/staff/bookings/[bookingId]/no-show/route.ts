import type { NextRequest } from "next/server";
import { markBookingNoShowController } from "@/modules/staff/staff.controller";

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return markBookingNoShowController(req, Number(bookingId));
}
