import { NextRequest } from "next/server";
import { getDivisionsController, createDivisionController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return getDivisionsController(req, resolvedParams);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return createDivisionController(req, resolvedParams);
}
