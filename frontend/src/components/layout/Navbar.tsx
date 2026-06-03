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

  /**
   * đọc localStorage mỗi lần đổi route và đồng bộ số thông báo
   */
  useEffect(() => {
    function syncUser() {
      setUser(getUser());
    }

    async function fetchPendingCount() {
      const token = getToken();
      if (!token) {
        setPendingCount(0);
        return;
      }
      try {
        const res = await getPendingInvitationCount(token);
        setPendingCount(res.count);
      } catch (err) {
        console.error("Failed to fetch pending count", err);
      }
    }

    syncUser();
    fetchPendingCount();

    window.addEventListener("storage", syncUser);
    window.addEventListener("storage", fetchPendingCount);
    window.addEventListener("auth-change", syncUser);
    window.addEventListener("auth-change", fetchPendingCount);
    window.addEventListener("invitation-count-change", fetchPendingCount);

    const interval = setInterval(fetchPendingCount, 15000);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("storage", fetchPendingCount);
      window.removeEventListener("auth-change", syncUser);
      window.removeEventListener("auth-change", fetchPendingCount);
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

  if (pathname.startsWith("/admin")) {
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