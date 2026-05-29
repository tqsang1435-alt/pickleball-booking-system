import { getAllCourtsController, createCourtController } from "@/modules/courts/courts.controller";
import { NextRequest } from "next/server";

export async function GET() {
  return getAllCourtsController();
}

export async function POST(req: NextRequest) {
  return createCourtController(req);
}