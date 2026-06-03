import { getPublicReviewsController } from "@/modules/reviews/reviews.controller";

export async function GET() {
  return getPublicReviewsController();
}
