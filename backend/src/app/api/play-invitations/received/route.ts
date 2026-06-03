import { NextRequest } from "next/server";
import { getReceivedInvitationsController } from "@/modules/play-invitations/play-invitations.controller";

export async function GET(req: NextRequest) {
  return getReceivedInvitationsController(req);
}
