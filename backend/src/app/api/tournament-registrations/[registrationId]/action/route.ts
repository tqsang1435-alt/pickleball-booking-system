import { NextRequest } from "next/server";
import { updateRegistrationActionController } from "@/modules/tournaments/tournaments.controller";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ registrationId: string }> }
) {
  const params = await props.params;
  return updateRegistrationActionController(req, params);
}
