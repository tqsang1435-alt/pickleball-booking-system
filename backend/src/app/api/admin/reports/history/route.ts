import type {
  NextRequest,
} from "next/server";

import {
  getReportExportHistoryController,
} from "@/modules/reports/reports.controller";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET(
  req: NextRequest
) {
  return getReportExportHistoryController(
    req
  );
}