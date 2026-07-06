import { NextRequest } from "next/server";
import { getDivisionByIdController, updateDivisionController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; divisionId: string }> }
) {
  const resolvedParams = await params;
  return getDivisionByIdController(req, resolvedParams);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; divisionId: string }> }
) {
  const resolvedParams = await params;
  return updateDivisionController(req, resolvedParams);
}
