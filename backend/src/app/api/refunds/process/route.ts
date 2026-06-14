import { NextRequest } from "next/server";
import { processRefundController } from "@/modules/refunds/refunds.controller";

export async function POST(req: NextRequest) {
  return processRefundController(req);
}
