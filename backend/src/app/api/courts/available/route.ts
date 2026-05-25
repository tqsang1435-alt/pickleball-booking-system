import { NextRequest } from "next/server";
import { getAvailableCourtsController } from "@/modules/courts/courts.controller";

export async function GET(req: NextRequest) {
  return getAvailableCourtsController(req);
}