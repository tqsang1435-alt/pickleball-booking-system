import { getMyNotificationsController } from "@/modules/notifications/notifications.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return getMyNotificationsController(req);
}
