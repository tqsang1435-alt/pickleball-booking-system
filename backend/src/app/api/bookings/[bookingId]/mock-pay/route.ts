import { NextRequest } from "next/server";
import { mockPayController } from "@/modules/bookings/bookings.module";

/**
 * Mock payment endpoint.
 * Thay the VNPay/Momo redirect trong giai doan dev.
 * Dev sau implement gateway that va xoa endpoint nay.
 *
 * Request body (optional):
 * { "paymentMethod": "VNPay" | "Momo" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  return mockPayController(req, Number(bookingId));
}

