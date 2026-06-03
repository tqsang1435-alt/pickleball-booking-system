import { NextRequest } from "next/server";
import { rejectInvitationController } from "@/modules/play-invitations/play-invitations.controller";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return rejectInvitationController(req, Number(id));
}
