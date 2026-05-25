import { NextRequest } from "next/server";
import { registerController } from "@/modules/auth/auth.controller";

export async function POST(req: NextRequest) {
  return registerController(req);
}