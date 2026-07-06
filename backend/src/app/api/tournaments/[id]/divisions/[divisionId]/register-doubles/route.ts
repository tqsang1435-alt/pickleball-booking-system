import { NextRequest } from "next/server";
import { registerDoublesController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; divisionId: string }> }
) {
  const resolvedParams = await params;
  return registerDoublesController(req, resolvedParams);
}
