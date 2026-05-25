import { getAllCourtsController } from "@/modules/courts/courts.controller";

export async function GET() {
  return getAllCourtsController();
}