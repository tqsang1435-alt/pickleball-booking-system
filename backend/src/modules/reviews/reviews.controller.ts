import * as reviewsService from "./reviews.service";
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
