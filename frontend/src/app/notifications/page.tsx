"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import StateBox from "@/components/common/StateBox";
import { getToken } from "@/utils/authStorage";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/services/notificationApi";
import type { NotificationItem } from "@/types/operationTypes";
import styles from "./NotificationsPage.module.css";

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
      setNotifs(notifs.map((n) => n.notificationId === id ? { ...n, status: "Read" } : n));
      window.dispatchEvent(new Event("auth-change"));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllAsRead() {
    const token = getToken();
    if (!token) return;
    try {
      await markAllNotificationsAsRead(token);
      setNotifs(notifs.map((n) => ({ ...n, status: "Read" })));
      window.dispatchEvent(new Event("auth-change"));
    } catch (err) {
      console.error(err);
    }
  }

  const hasUnread = notifs.some((n) => n.status === "Unread");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Trung tâm thông báo</h1>
          <p>Theo dõi cập nhật booking, thanh toán, nhóm chơi và hệ thống.</p>
        </div>
        {hasUnread ? (
          <Button type="button" variant="secondary" onClick={handleMarkAllAsRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        ) : null}
      </header>

      {loading ? (
        <StateBox variant="loading" title="Đang tải thông báo" description="Vui lòng chờ trong giây lát." />
      ) : notifs.length === 0 ? (
        <StateBox variant="empty" title="Bạn chưa có thông báo nào" description="Các cập nhật quan trọng sẽ xuất hiện tại đây." />
      ) : (
        <section className={styles.list} aria-label="Danh sách thông báo">
          {notifs.map((notification) => {
            const isUnread = notification.status === "Unread";
            return (
              <button
                key={notification.notificationId}
                type="button"
                className={`${styles.item} ${isUnread ? styles.itemUnread : ""}`}
                onClick={() => isUnread && handleMarkAsRead(notification.notificationId)}
                aria-disabled={!isUnread}
              >
                <span>
                  <span className={styles.titleRow}>
                    {isUnread ? <span className={styles.unreadDot} aria-hidden="true" /> : null}
                    <span className={styles.itemTitle}>{notification.title}</span>
                  </span>
                  <span className={styles.itemMessage}>{notification.message}</span>
                </span>
                <span className={styles.itemTime}>
                  {new Date(notification.createdAt).toLocaleString("vi-VN")}
                </span>
              </button>
            );
          })}
        </section>
      )}
    </main>
  );
}
