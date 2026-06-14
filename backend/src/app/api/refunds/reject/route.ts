import { NextRequest } from "next/server";
import { rejectRefundController } from "@/modules/refunds/refunds.controller";

export async function POST(req: NextRequest) {
  return rejectRefundController(req);
}
