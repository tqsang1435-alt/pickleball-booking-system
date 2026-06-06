import { markAsReadController } from "@/modules/notifications/notifications.controller";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return markAsReadController(req, { params });
}
