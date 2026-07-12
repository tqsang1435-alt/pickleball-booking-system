import { checkReviewEligibilityController } from "@/modules/reviews/reviews.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return checkReviewEligibilityController(req);
}
