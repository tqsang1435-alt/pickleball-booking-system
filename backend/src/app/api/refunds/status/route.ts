import { NextRequest } from "next/server";
import { getRefundStatusController } from "@/modules/refunds/refunds.controller";

export async function GET(req: NextRequest) {
  return getRefundStatusController(req);
}
