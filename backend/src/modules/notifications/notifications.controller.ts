import { NextRequest, NextResponse } from "next/server";
import {
  getMyNotifications,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notifications.service";

import { requireAuth } from "@/middlewares/auth.middleware";

export async function getMyNotificationsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const userId = auth.userId;

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const data = await getMyNotifications(userId, limit);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[Notifications] getMyNotifications error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function getUnreadCountController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const userId = auth.userId;

    const data = await countUnreadNotifications(userId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[Notifications] getUnreadCount error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function markAsReadController(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const userId = auth.userId;

    const notificationId = parseInt(params.id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    await markNotificationAsRead(notificationId, userId);
    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error: any) {
    console.error("[Notifications] markAsRead error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function markAllAsReadController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const userId = auth.userId;

    await markAllNotificationsAsRead(userId);
    return NextResponse.json({ success: true, message: "All marked as read" });
  } catch (error: any) {
    console.error("[Notifications] markAllAsRead error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
