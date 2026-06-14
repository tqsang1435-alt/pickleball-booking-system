import type {
  NextRequest,
} from "next/server";

import {
  getUsersController,
} from "@/modules/roles/roles.controller";

export const dynamic =
  "force-dynamic";

export async function GET(
  req: NextRequest
) {
  return getUsersController(req);
}