import { NextRequest } from "next/server";
import { completeManualRefundController } from "@/modules/refunds/refunds.controller";

export async function POST(req: NextRequest) {
  return completeManualRefundController(req);
}
