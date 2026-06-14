import type {
  NextRequest,
} from "next/server";

import {
  exportReportController,
} from "@/modules/reports/reports.controller";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function POST(
  req: NextRequest
) {
  return exportReportController(
    req
  );
}