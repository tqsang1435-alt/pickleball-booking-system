import { NextRequest } from "next/server";
import { createReviewController } from "@/modules/reviews/reviews.controller";

export async function POST(req: NextRequest) {
  return createReviewController(req);
}
