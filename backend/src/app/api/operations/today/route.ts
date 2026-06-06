import { NextRequest } from "next/server";
import { getTodayOperationsController } from "@/modules/operations/operations.controller";

export async function GET(req: NextRequest) {
  return getTodayOperationsController(req);
}
