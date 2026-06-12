import { momoIpnController } from "@/modules/payments/payments.controller";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return momoIpnController(req);
}
