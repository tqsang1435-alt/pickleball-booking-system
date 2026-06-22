import { NextResponse } from "next/server";
import { processChatbotMessage } from "@/modules/ai/ai.controller";
import { verifyAccessToken } from "@/utils/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    let userId: number | undefined = undefined;
    let userRoles: string[] = [];

    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyAccessToken(token);
        userId = decoded.userId;
        userRoles = decoded.roles || [];
      } catch (jwtError) {
        console.warn("Invalid JWT in chatbot route:", jwtError);
      }
    }

    const result = await processChatbotMessage(body, userId, userRoles);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
