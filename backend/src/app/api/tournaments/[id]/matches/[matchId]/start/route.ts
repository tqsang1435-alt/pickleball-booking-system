import { NextRequest } from "next/server";
import { startMatchController } from "@/modules/tournaments/tournaments.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const resolvedParams = await params;
  return startMatchController(req, resolvedParams);
}
