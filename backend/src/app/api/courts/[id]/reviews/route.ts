import { NextRequest } from "next/server";
import { getCourtReviewsController } from "@/modules/reviews/reviews.controller";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getCourtReviewsController(req, context);
}
