import { NextRequest } from "next/server";
import { getClubReviewsController } from "@/modules/reviews/reviews.controller";

export async function GET(req: NextRequest) {
  return getClubReviewsController(req);
}
