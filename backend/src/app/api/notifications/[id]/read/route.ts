import { markAsReadController } from "@/modules/notifications/notifications.controller";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return markAsReadController(req, { params });
}
