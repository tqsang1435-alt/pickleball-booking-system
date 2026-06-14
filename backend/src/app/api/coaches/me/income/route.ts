import { NextRequest } from "next/server";
import { getMyIncome } from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getMyIncome(req);
}
