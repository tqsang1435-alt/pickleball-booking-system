"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  clearAuth,
  getUser,
  getToken,
} from "@/utils/authStorage";

import type { AuthUser } from "@/types/auth";
import { getPendingInvitationCount } from "@/services/matchingApi";
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead } from "@/services/notificationApi";
import type { NotificationItem } from "@/types/operationTypes";

import styles from "./Navbar.module.css";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/courts", label: "Sân" },
  { href: "/coaches", label: "Coach" },
  { href: "/combo", label: "Combo" },
  { href: "/matching", label: "Tìm người chơi" },
  { href: "/bookings", label: "Lịch sử booking" },
];

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "profile";
  const router = useRouter();

  /**
   * user đang login
   */
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Notifications
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  /**
   * đọc localStorage mỗi lần đổi route và đồng bộ số thông báo
   */
  useEffect(() => {
    function syncUser() {
      setUser(getUser());
    }

    async function fetchPendingCount() {
      const token = getToken();
      const currentUser = getUser();
      const role = String(currentUser?.RoleName || currentUser?.role || currentUser?.roles?.[0] || "").toLowerCase();
      
      // Chỉ Player mới có chức năng tìm người chơi (matching)
      if (!token || !role.includes("player")) {
        setPendingCount(0);
        return;
      }
      try {
        const res = await getPendingInvitationCount(token);
        setPendingCount(res?.count || 0);
      } catch (err) {
        console.error("Failed to fetch pending count", err);
        setPendingCount(0);
      }
    }

    async function fetchNotifs() {
      const token = getToken();
      if (!token) {
        setUnreadNotifCount(0);
        return;
      }
      try {
        const count = await getUnreadNotificationCount(token);
        setUnreadNotifCount(typeof count === 'number' ? count : 0);
      } catch (err) {
        console.error("Failed to fetch notif count", err);
        setUnreadNotifCount(0);
      }
    }

    syncUser();
    fetchPendingCount();
    fetchNotifs();

    window.addEventListener("storage", syncUser);
    window.addEventListener("storage", fetchPendingCount);
    window.addEventListener("auth-change", syncUser);
    window.addEventListener("auth-change", fetchPendingCount);
    window.addEventListener("auth-change", fetchNotifs);
    window.addEventListener("invitation-count-change", fetchPendingCount);

    const interval = setInterval(() => {
      fetchPendingCount();
      fetchNotifs();
    }, 15000);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("storage", fetchPendingCount);
      window.removeEventListener("auth-change", syncUser);
      window.removeEventListener("auth-change", fetchPendingCount);
      window.removeEventListener("auth-change", fetchNotifs);
      window.removeEventListener("invitation-count-change", fetchPendingCount);
      clearInterval(interval);
    };
  }, [pathname]);

  /**
   * logout
   */
  function handleLogout() {
    clearAuth();

    setUser(null);
    setPendingCount(0);
    setUnreadNotifCount(0);

    window.dispatchEvent(new Event("auth-change"));

    router.push("/");
    router.refresh();
  }

  /**
   * tên hiển thị
   */
  const fullName =
    user?.FullName ||
    user?.fullName ||
    user?.Email ||
    user?.email ||
    "Tài khoản";

  /**
   * role user
   */
  const role = String(
    user?.RoleName ||
    user?.role ||
    user?.roles?.[0] ||
    ""
  ).toLowerCase();

  let profilePath = "/profile";

  if (role.includes("admin") || role.includes("manager") || role.includes("staff")) {
    profilePath = "/admin";
  } else if (role.includes("coach")) {
    profilePath = "/coach-dashboard";
  } else {
    profilePath = "/profile";
  }

  let navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/courts", label: "Sân" },
    { href: "/coaches", label: "Coach" },
    { href: "/combo", label: "Combo" },
    { href: "/matching", label: "Tìm người chơi" },
    { href: "/bookings", label: "Lịch sử booking" },
  ];

  if (role.includes("coach")) {
    navItems = [
      { href: "/coach-dashboard?tab=profile", label: "Hồ sơ" },
      { href: "/coach-dashboard?tab=expertise", label: "Chuyên môn" },
      { href: "/coach-dashboard?tab=fee", label: "Học phí" },
      { href: "/coach-dashboard?tab=schedules", label: "Lịch dạy" },
      { href: "/coach-dashboard?tab=bookings", label: "Đơn đặt lịch" },
    ];
  }

  const isAdminOrStaff = role.includes("admin") || role.includes("manager") || role.includes("staff");

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
    return null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* LOGO */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>◐</span>

          <span>
            Pickle <b>Club</b>
          </span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            let active = false;
            
            if (item.href.includes("?tab=")) {
              // Đối với coach dashboard tabs
              const urlTab = new URLSearchParams(item.href.split("?")[1]).get("tab");
              active = pathname === item.href.split("?")[0] && currentTab === urlTab;
            } else if (item.href === "/") {
              active = pathname === "/";
            } else {
              active = pathname.startsWith(item.href);
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.active : ""}
              >
                {item.label}
                {item.href === "/matching" && pendingCount > 0 && (
                  <span className={styles.badge}>
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className={styles.actions}>
          {user ? (
            <>
              {/* NOTIFICATION BELL */}
              <div className={styles.notificationWrapper}>
                <button
                  type="button"
                  className={styles.bellButton}
                  onClick={async () => {
                    const token = getToken();
                    if (token && !showNotifDropdown) {
                      const data = await getMyNotifications(token, 5);
                      setNotifs(data);
                    }
                    setShowNotifDropdown(!showNotifDropdown);
                  }}
                >
                  <svg className={styles.bellIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifCount > 0 && (
                    <span className={styles.notificationBadge}>
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </span>
                  )}
                </button>
                {showNotifDropdown && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <h3>Thông báo</h3>
                      <Link href="/notifications" onClick={() => setShowNotifDropdown(false)}>Xem tất cả</Link>
                    </div>
                    <div className={styles.dropdownList}>
                      {notifs.length === 0 ? (
                        <div className={styles.dropdownEmpty}>Bạn chưa có thông báo nào.</div>
                      ) : (
                        notifs.map(n => (
                          <div
                            key={n.notificationId}
                            className={`${styles.notificationItem} ${n.status === 'Unread' ? styles.unread : ''}`}
                            onClick={async () => {
                              if (n.status === 'Unread') {
                                const token = getToken();
                                if (token) await markNotificationAsRead(token, n.notificationId);
                                setUnreadNotifCount(prev => Math.max(0, prev - 1));
                                setNotifs(prev => prev.map(x => x.notificationId === n.notificationId ? { ...x, status: 'Read' } : x));
                              }
                            }}
                          >
                            <span className={styles.notifTitle}>{n.title}</span>
                            <span className={styles.notifMessage}>{n.message}</span>
                            <span className={styles.notifTime}>{new Date(n.createdAt).toLocaleString("vi-VN")}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className={styles.dropdownFooter}>
                      <Link href="/notifications" onClick={() => setShowNotifDropdown(false)}>
                        Mở trung tâm thông báo
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* ADMIN DASHBOARD LINK */}
              {isAdminOrStaff && (
                <Link
                  href={profilePath}
                  className={styles.adminLink}
                >
                  ⚙️ Quản trị
                </Link>
              )}

              {/* PROFILE */}
              <Link
                href={profilePath}
                className={styles.profile}
              >
                {fullName}
              </Link>

              {/* LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              {/* LOGIN */}
              <Link
                href="/login"
                className={styles.login}
              >
                Đăng nhập
              </Link>

              {/* REGISTER */}
              <Link
                href="/register"
                className={styles.register}
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}