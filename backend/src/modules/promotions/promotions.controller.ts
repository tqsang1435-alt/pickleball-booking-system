import * as promotionService from "./promotions.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export async function getAllPromotionsController() {
  try {
    const result = await promotionService.getAllPromotions();

    return successResponse(result, "Get promotions successfully");
  } catch (error) {
    return handleError(error);
  }
}