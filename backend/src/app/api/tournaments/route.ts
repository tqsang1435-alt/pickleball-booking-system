import { NextRequest } from "next/server";
import { getTournamentsController, createTournamentController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getTournamentsController(req);
}

export async function POST(req: NextRequest) {
  return createTournamentController(req);
}
