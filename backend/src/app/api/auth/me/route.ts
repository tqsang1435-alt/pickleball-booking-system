import { NextRequest } from "next/server";
import { meController } from "@/modules/auth/auth.controller";

export async function GET(req: NextRequest) {
  return meController(req);
}