import { NextRequest } from "next/server";

import {
  getMeController,
  updateMeController,
} from "@/modules/users/users.controller";

export async function GET(req: NextRequest) {
  return getMeController(req);
}

export async function PUT(req: NextRequest) {
  return updateMeController(req);
}