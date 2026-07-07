import { NextRequest } from "next/server";
import { publishTournamentController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return publishTournamentController(req, resolvedParams);
}
