import { NextRequest } from "next/server";
import { verifyRegisterOtpController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return verifyRegisterOtpController(req);
}