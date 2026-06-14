import type { NextRequest } from "next/server";
import { createIncidentReportController, getMyIncidentsController } from "@/modules/staff/staff.controller";

export async function GET(req: NextRequest) {
  return getMyIncidentsController(req);
}

export async function POST(req: NextRequest) {
  return createIncidentReportController(req);
}
