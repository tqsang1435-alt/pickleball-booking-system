import { NextRequest } from "next/server";
import {
  getCourtSlotsController,
  createCourtSlotController,
} from "@/modules/courts/courts.controller";

export async function GET(req: NextRequest) {
  return getCourtSlotsController(req);
}

export async function POST(req: NextRequest) {
  return createCourtSlotController(req);
}