import { NextRequest } from "next/server";
import { applySecurity } from "@/modules/ai/ai-security.middleware";
import { retrainAIModel } from "@/modules/ai/ai-analytics.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = applySecurity(req, ["Admin", "Manager"]);
    if (auth instanceof Response) return auth;

    const result = await retrainAIModel();
    return successResponse(result, "Đã khởi chạy huấn luyện lại mô hình AI thành công");
  } catch (error) {
    return handleError(error);
  }
}
