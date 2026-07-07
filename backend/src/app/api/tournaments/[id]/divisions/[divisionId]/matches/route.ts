import { NextRequest } from "next/server";
import { getDivisionMatchesController, deleteDivisionMatchesController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; divisionId: string }> }
) {
  const resolvedParams = await params;
  return getDivisionMatchesController(req, resolvedParams);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; divisionId: string }> }
) {
  const resolvedParams = await params;
  return deleteDivisionMatchesController(req, resolvedParams);
}
