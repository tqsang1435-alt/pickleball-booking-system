import { NextRequest } from "next/server";
import {
  listPlayGroupsController,
  createPlayGroupController,
} from "@/modules/playgroups/playgroups.controller";

export async function GET(req: NextRequest) {
  return listPlayGroupsController(req);
}

export async function POST(req: NextRequest) {
  return createPlayGroupController(req);
}
