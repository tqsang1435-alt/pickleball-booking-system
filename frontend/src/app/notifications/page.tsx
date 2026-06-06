"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/authStorage";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/notificationApi";
import type { NotificationItem } from "@/types/operationTypes";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, []);

  async function fetchNotifs() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const data = await getMyNotifications(token, 100);
      setNotifs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: number) {
    const token = getToken();
    if (!token) return;
    try {
      await markNotificationAsRead(token, id);
      setNotifs(notifs.map(n => n.notificationId === id ? { ...n, status: "Read" } : n));
      window.dispatchEvent(new Event("auth-change")); // To update the bell badge
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllAsRead() {
    const token = getToken();
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      setNotifs(notifs.map(n => ({ ...n, status: "Read" })));
      window.dispatchEvent(new Event("auth-change")); // To update the bell badge
    } catch (err) {
      console.error(err);
    }
  }

  const hasUnread = notifs.some(n => n.status === "Unread");

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#171a2a", margin: 0 }}>Trung tâm thông báo</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              padding: "8px 16px",
              background: "#eef9df",
              color: "#2f5a24",
              border: "1.5px solid #3f6b32",
              borderRadius: 14,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14
            }}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Đang tải thông báo...</div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#f8f9fa", borderRadius: 16, color: "#64748b" }}>
          Bạn chưa có thông báo nào.
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #dff5c7", overflow: "hidden" }}>
          {notifs.map(n => (
            <div
              key={n.notificationId}
              onClick={() => n.status === "Unread" && handleMarkAsRead(n.notificationId)}
              style={{
                padding: 20,
                borderBottom: "1px solid #f0f0f0",
                background: n.status === "Unread" ? "#f5ffec" : "#ffffff",
                cursor: n.status === "Unread" ? "pointer" : "default",
                transition: "0.2s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: "#171a2a", fontSize: 16 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(n.createdAt).toLocaleString("vi-VN")}</div>
              </div>
              <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.5 }}>{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
