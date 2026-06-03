import { NextRequest } from "next/server";
import { getSuitableOpponentsController } from "@/modules/player-matching/player-matching.controller";

export async function GET(req: NextRequest) {
  return getSuitableOpponentsController(req);
}
