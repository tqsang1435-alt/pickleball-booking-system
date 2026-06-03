import { NextRequest } from "next/server";
import { getSuitableTeammatesController } from "@/modules/player-matching/player-matching.controller";

export async function GET(req: NextRequest) {
  return getSuitableTeammatesController(req);
}
