import { getAllPromotionsController } from "@/modules/promotions/promotions.controller";

export async function GET() {
  return getAllPromotionsController();
}