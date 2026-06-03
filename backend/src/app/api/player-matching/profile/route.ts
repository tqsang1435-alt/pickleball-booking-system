import { NextRequest } from "next/server";
import {
  getPlayerProfileController,
  savePlayerProfileController,
} from "@/modules/player-matching/player-matching.controller";

export async function GET(req: NextRequest) {
  return getPlayerProfileController(req);
}

export async function POST(req: NextRequest) {
  return savePlayerProfileController(req);
}

export async function PUT(req: NextRequest) {
  return savePlayerProfileController(req);
}
