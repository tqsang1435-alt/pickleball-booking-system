import { NextRequest } from "next/server";
import { updateMyProfileController } from "@/modules/coaches/coaches.controller";

export async function PUT(req: NextRequest) {
  return updateMyProfileController(req);
}
