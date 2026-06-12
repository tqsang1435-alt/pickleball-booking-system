import { NextRequest } from "next/server";
import { approveRefundController } from "@/modules/refunds/refunds.controller";

export async function POST(req: NextRequest) {
  return approveRefundController(req);
}
