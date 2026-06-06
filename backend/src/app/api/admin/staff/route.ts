import { NextRequest } from "next/server";
import { getAllStaffController, adminCreateStaffController } from "@/modules/users/users.controller";

export async function GET(req: NextRequest) {
  return getAllStaffController(req);
}

export async function POST(req: NextRequest) {
  return adminCreateStaffController(req);
}
