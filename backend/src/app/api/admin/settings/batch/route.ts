import { NextRequest } from "next/server";
import { batchUpdateSettingsController } from "@/modules/settings/settings.controller";

export async function PATCH(req: NextRequest) {
  return batchUpdateSettingsController(req);
}
