import { NextRequest } from "next/server";
import { applySecurity } from "@/modules/ai/ai-security.middleware";
import { getAccuracyMetrics } from "@/modules/ai/ai-analytics.controller";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = applySecurity(req, ["Admin", "Manager"]);
    if (auth instanceof Response) return auth;

    const data = await getAccuracyMetrics();
    return successResponse(data, "Lấy dữ liệu đối soát độ chính xác AI thành công");
  } catch (error) {
    return handleError(error);
  }
}
