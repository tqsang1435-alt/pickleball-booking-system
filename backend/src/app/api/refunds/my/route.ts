import { NextRequest } from "next/server";
import { getMyRefundsController } from "@/modules/refunds/refunds.controller";

export async function GET(req: NextRequest) {
  return getMyRefundsController(req);
}
