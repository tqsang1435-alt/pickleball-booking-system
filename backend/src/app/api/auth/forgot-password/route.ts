import { NextRequest } from "next/server";
import { forgotPasswordController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return forgotPasswordController(req);
}