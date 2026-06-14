import { NextRequest } from "next/server";
import { getSeedStatusController, runSeedController } from "@/modules/settings/settings.controller";

export async function GET(req: NextRequest) {
  return getSeedStatusController(req);
}

export async function POST(req: NextRequest) {
  return runSeedController(req);
}
