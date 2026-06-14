import { NextRequest } from "next/server";
import {
  getSettingsController,
  updateSettingController,
} from "@/modules/settings/settings.controller";

export async function GET(req: NextRequest) {
  return getSettingsController(req);
}

export async function PATCH(req: NextRequest) {
  return updateSettingController(req);
}
