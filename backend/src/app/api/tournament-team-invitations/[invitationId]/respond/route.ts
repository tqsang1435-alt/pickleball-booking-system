import { NextRequest } from "next/server";
import { respondInvitationController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const resolvedParams = await params;
  return respondInvitationController(req, resolvedParams);
}
