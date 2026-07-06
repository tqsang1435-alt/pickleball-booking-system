import { NextRequest } from "next/server";
import { getTournamentByIdController, updateTournamentController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return getTournamentByIdController(req, resolvedParams);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return updateTournamentController(req, resolvedParams);
}
