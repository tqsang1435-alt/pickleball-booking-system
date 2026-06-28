import { NextRequest } from "next/server";
import { applySecurity } from "@/modules/ai/ai-security.middleware";
import { getRecommendations } from "@/modules/ai/ai-analytics.controller";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = applySecurity(req, ["Admin", "Manager"]);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const data = await getRecommendations(date);
    return successResponse(data, "Lấy đề xuất khuyến mãi thành công");
  } catch (error) {
    return handleError(error);
  }
}
