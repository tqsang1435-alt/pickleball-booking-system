import { NextRequest } from "next/server";
import { loginController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return loginController(req);
}