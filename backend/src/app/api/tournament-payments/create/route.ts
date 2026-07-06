import { NextRequest } from "next/server";
import { createTournamentPaymentController } from "@/modules/tournaments/tournaments.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return createTournamentPaymentController(req);
}
