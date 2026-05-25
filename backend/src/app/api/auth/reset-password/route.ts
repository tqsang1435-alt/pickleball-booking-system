import { NextRequest } from "next/server";
import { resetPasswordController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return resetPasswordController(req);
}