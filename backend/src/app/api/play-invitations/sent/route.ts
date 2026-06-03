import { NextRequest } from "next/server";
import { getSentInvitationsController } from "@/modules/play-invitations/play-invitations.controller";

export async function GET(req: NextRequest) {
  return getSentInvitationsController(req);
}
