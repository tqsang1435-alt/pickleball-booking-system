import { NextRequest } from "next/server";
import { requireAuth } from "@/middlewares/auth.middleware";
import { processPlayerOpponentMatch } from "@/modules/ai/ai.controller";
import { successResponse, errorResponse } from "@/utils/response";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body allowed
    }
    const payload = { ...body, userId: auth.userId };
    
    const result = await processPlayerOpponentMatch(payload);
    return successResponse(result, "Tìm cặp đối thủ bằng AI thành công");
  } catch (error: any) {
    const status = error.message.includes("đồng đội") ? 400 : 500;
    return errorResponse(error.message, status);
  }
}
