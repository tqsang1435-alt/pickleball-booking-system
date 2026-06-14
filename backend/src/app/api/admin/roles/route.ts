import type {
  NextRequest,
} from "next/server";

import {
  createRoleController,
  getRolesController,
} from "@/modules/roles/roles.controller";

export const dynamic =
  "force-dynamic";

export async function GET(
  req: NextRequest
) {
  return getRolesController(req);
}

export async function POST(
  req: NextRequest
) {
  return createRoleController(req);
}
