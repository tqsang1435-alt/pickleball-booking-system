"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StaffDashboard from "@/modules/operations/StaffDashboard";
import OperationsPage from "@/modules/operations/OperationsPage";
import { getToken, getUser } from "@/utils/authStorage";
import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import type { NotificationItem } from "@/types/operationTypes";
import styles from "./page.module.css";

type View = "dashboard" | "detail";

export default function StaffOperationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams?.get("view") === "detail" ? "detail" : "dashboard";
  const [view, setView] = useState<View>(initial);
  const effectiveView: View = searchParams?.get("view") === "detail" ? "detail" : view;

  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("Nhân viên");
  const [userEmail, setUserEmail] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    const role = String(u?.RoleName || u?.role || u?.roles?.[0] || "").toLowerCase();
    if (!t || (!role.includes("admin") && !role.includes("staff") && !role.includes("manager"))) {
      router.push("/login");
      return;
    }
    setToken(t);
    setUserName(u?.FullName || u?.fullName || "Nhân viên");
    setUserEmail(u?.Email || u?.email || "");
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchNotifications(token);
    }
  }, [token]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function fetchNotifications(t: string) {
    try {
      const res = await apiClient<ApiResponse<NotificationItem[]>>(
        "/api/notifications?limit=20",
        { token: t }
      );
      setNotifications(res.data ?? []);
    } catch { /* silent */ }
  }

  async function markAllRead() {
    if (!token) return;
    try {
      await apiClient("/api/notifications/read-all", {
        method: "POST",
        token,
      });
      setNotifications(prev => prev.map(n => ({ ...n, status: "Read" as const })));
    } catch { /* silent */ }
  }

  const unreadCount = notifications.filter(n => n.status === "Unread").length;
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "NV";

  return (
    <div className={styles.wrapper}>
      {/* ── Sticky Top Header Bar ── */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumbs}>
            <span>Nhân viên</span>
            <span className={styles.chevron}>/</span>
            <span className={styles.currentCrumb}>Trung tâm Vận hành</span>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${effectiveView === "dashboard" ? styles.tabActive : ""}`}
              onClick={() => setView("dashboard")}
            >
              Tổng quan ca
            </button>
            <button
              className={`${styles.tab} ${effectiveView === "detail" ? styles.tabActive : ""}`}
              onClick={() => setView("detail")}
            >
              Chi tiết & Lọc ngày
            </button>
          </div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.searchBar}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Tìm mã đặt sân, tên khách..." readOnly />
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Notification bell */}
          <div className={styles.notifWrap} ref={notifRef}>
            <button
              className={styles.btnIcon}
              onClick={() => setNotifOpen(o => !o)}
              title="Thông báo"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className={styles.notifBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span className={styles.notifTitle}>Thông báo</span>
                  {unreadCount > 0 && (
                    <button className={styles.notifMarkAll} onClick={markAllRead}>
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>Không có thông báo mới</div>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div
                        key={n.notificationId}
                        className={`${styles.notifItem} ${n.status === "Unread" ? styles.notifUnread : ""}`}
                      >
                        <div className={styles.notifItemTitle}>{n.title}</div>
                        <div className={styles.notifItemMsg}>{n.message}</div>
                        <div className={styles.notifItemTime}>
                          {new Date(n.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit", minute: "2-digit",
                            day: "numeric", month: "numeric",
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button className={styles.btnIcon} onClick={() => window.location.reload()} title="Làm mới trang">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          {/* Quick Actions Blue Button */}
          <button
            className={styles.btnQuickActions}
            onClick={() => setView(effectiveView === "dashboard" ? "detail" : "dashboard")}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Thao tác nhanh
          </button>

          {/* User Round Initials Avatar */}
          <div className={styles.avatar} title={`${userName} (${userEmail})`}>
            {userInitials}
          </div>
        </div>
      </header>

      {/* ── Scrollable Content Area with Gray background ── */}
      <div className={styles.contentArea}>
        {effectiveView === "dashboard" ? <StaffDashboard /> : <OperationsPage />}
      </div>
    </div>
  );
}
