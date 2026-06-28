import { NextRequest } from "next/server";
import { getMyReviewsController } from "@/modules/reviews/reviews.controller";

export async function GET(req: NextRequest) {
  return getMyReviewsController(req);
}
