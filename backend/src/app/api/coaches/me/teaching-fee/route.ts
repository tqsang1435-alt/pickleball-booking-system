import { NextRequest } from "next/server";
import { updateMyFeeController } from "@/modules/coaches/coaches.controller";

export async function PUT(req: NextRequest) {
  return updateMyFeeController(req);
}
