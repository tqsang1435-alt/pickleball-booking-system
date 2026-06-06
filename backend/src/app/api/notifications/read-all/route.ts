import { markAllAsReadController } from "@/modules/notifications/notifications.controller";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
  return markAllAsReadController(req);
}
