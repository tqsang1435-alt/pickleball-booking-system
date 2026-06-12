import { momoReturnController } from "@/modules/payments/payments.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return momoReturnController(req);
}
