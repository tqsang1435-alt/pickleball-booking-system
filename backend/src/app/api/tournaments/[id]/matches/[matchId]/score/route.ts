import { NextRequest } from "next/server";
import { reportMatchScoreController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const resolvedParams = await params;
  return reportMatchScoreController(req, resolvedParams);
}
