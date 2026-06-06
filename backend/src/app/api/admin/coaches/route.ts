import { NextRequest } from "next/server";
import { 
  getAllCoachesAdminController,
  adminCreateCoachController 
} from "@/modules/coaches/coaches.controller";

export async function GET(req: NextRequest) {
  return getAllCoachesAdminController(req);
}

export async function POST(req: NextRequest) {
  return adminCreateCoachController(req);
}
