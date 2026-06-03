import { NextRequest } from "next/server";
import { acceptInvitationController } from "@/modules/play-invitations/play-invitations.controller";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return acceptInvitationController(req, Number(id));
}
