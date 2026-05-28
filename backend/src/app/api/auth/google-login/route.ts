import { NextRequest } from "next/server";
import { googleLoginController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return googleLoginController(req);
}