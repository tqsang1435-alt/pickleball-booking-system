import { NextRequest } from "next/server";
import { createInvitationController } from "@/modules/play-invitations/play-invitations.controller";

export async function POST(req: NextRequest) {
  return createInvitationController(req);
}
