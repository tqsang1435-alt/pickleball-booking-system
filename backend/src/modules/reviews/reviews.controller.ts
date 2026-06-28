import * as reviewsService from "./reviews.service";
import { NextRequest } from "next/server";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { createReviewSchema } from "./reviews.dto";
import { requireAuth } from "@/middlewares/auth.middleware";

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
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    if (!coachId || isNaN(coachId)) {
      throw new Error("coachId không hợp lệ");
    }

    const result = await reviewsService.getCoachReviews(coachId, page, limit);

    return successResponse(result, "Get coach reviews successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getCourtReviewsController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const courtId = Number(id);
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    if (!courtId || isNaN(courtId)) {
      throw new Error("courtId không hợp lệ");
    }

    const result = await reviewsService.getCourtReviews(courtId, page, limit);

    return successResponse(result, "Get court reviews successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getClubReviewsController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const result = await reviewsService.getClubReviews(page, limit);

    return successResponse(result, "Get club reviews successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getMyReviewsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const result = await reviewsService.getMyReviews(auth.userId, page, limit);

    return successResponse(result, "Get my reviews successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function createReviewController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    const payload = createReviewSchema.parse(body);

    const result = await reviewsService.createReview(auth.userId, payload);

    return successResponse(result, "Đánh giá thành công");
  } catch (error) {
    return handleError(error);
  }
}
