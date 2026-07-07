import { NextRequest } from "next/server";
import { getDivisionStandingsController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; divisionId: string }> }
) {
  const resolvedParams = await params;
  return getDivisionStandingsController(req, resolvedParams);
}
