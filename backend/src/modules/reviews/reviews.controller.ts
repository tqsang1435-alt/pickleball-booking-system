import * as reviewsService from "./reviews.service";
import { NextRequest } from "next/server";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export async function getPublicReviewsController() {
  try {
    const result = await reviewsService.getPublicReviews(6);
    return successResponse(result, "Get public reviews successfully");
  } catch (error) {
    return handleError(error);
  }
}
export async function getCoachReviewsController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const coachId = Number(id);

    if (!coachId || isNaN(coachId)) {
      throw new Error("coachId không hợp lệ");
    }

    const result = await reviewsService.getCoachReviews(coachId);

    return successResponse(result, "Get coach reviews successfully");
  } catch (error) {
    return handleError(error);
  }
}

