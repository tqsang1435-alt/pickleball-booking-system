import { NextRequest } from "next/server";
import { getCoachReviewsController } from "@/modules/reviews/reviews.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getCoachReviewsController(req, context);
}