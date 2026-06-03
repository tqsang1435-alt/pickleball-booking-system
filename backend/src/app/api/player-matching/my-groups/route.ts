import { NextRequest } from "next/server";
import { getUserActiveGroupsController } from "@/modules/player-matching/player-matching.controller";

export async function GET(req: NextRequest) {
  return getUserActiveGroupsController(req);
}
