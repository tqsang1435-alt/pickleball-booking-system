import { NextRequest } from "next/server";
import { getDivisionRegistrationsController } from "@/modules/tournaments/tournaments.controller";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string; divisionId: string }> }
) {
  const params = await props.params;
  return getDivisionRegistrationsController(req, params);
}
