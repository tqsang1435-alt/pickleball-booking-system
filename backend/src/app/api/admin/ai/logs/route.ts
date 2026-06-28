import { NextRequest } from "next/server";
import { applySecurity } from "@/modules/ai/ai-security.middleware";
import { getLogs } from "@/modules/ai/ai-analytics.controller";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = applySecurity(req, ["Admin", "Manager"]);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "100");

    const data = await getLogs(limit);
    return successResponse(data, "Lấy danh sách log AI thành công");
  } catch (error) {
    return handleError(error);
  }
}
