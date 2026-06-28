import { NextRequest } from "next/server";
import { applySecurity } from "@/modules/ai/ai-security.middleware";
import { triggerManualRun } from "@/modules/ai/ai-analytics.controller";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = applySecurity(req, ["Admin", "Manager"]);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    const { date, thresholdOccupancy, basePrice } = body;

    const result = await triggerManualRun(date, thresholdOccupancy, basePrice);
    return successResponse(result, "Chạy dự báo và đề xuất thành công");
  } catch (error) {
    return handleError(error);
  }
}
