import { NextResponse } from "next/server";
import { processCoachRecommendation } from "@/modules/ai/ai.controller";
import { CoachRecommendRequest } from "@/modules/ai/ai.type";

export async function POST(req: Request) {
  try {
    const body: CoachRecommendRequest = await req.json();
    const result = await processCoachRecommendation(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
