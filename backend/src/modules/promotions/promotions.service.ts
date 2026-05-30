import * as promotionRepository from "./promotions.repository";

export async function getAllPromotions() {
  return promotionRepository.findAllPromotions();
}