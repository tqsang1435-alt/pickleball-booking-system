import { NextRequest } from "next/server";
import { getManagerRefundsController } from "@/modules/refunds/refunds.controller";

export async function GET(req: NextRequest) {
  return getManagerRefundsController(req);
}
