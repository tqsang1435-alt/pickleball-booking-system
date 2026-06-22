import { NextRequest } from "next/server";
import { requireAuth } from "@/middlewares/auth.middleware";
import { processPlayerTeammateMatch } from "@/modules/ai/ai.controller";
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
    
    const result = await processPlayerTeammateMatch(payload);
    return successResponse(result, "Tìm đồng đội bằng AI thành công");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
