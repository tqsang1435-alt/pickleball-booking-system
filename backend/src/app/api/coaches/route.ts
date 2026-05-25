import { getAllCoachesController } from "@/modules/coaches/coaches.controller";

export async function GET() {
  return getAllCoachesController();
}