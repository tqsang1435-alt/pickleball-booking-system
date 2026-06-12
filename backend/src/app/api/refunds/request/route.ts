import { NextRequest } from "next/server";
import { requestRefundController } from "@/modules/refunds/refunds.controller";

export async function POST(req: NextRequest) {
  return requestRefundController(req);
}
