"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  clearAuth,
  getUser,
} from "@/utils/authStorage";

import type { AuthUser } from "@/types/auth";

import styles from "./Navbar.module.css";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/courts", label: "Sân" },
  { href: "/coaches", label: "Coach" },
  { href: "/combo", label: "Combo" },
  { href: "/matching", label: "Tìm người chơi" },
  { href: "/pricing", label: "Bảng giá" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  /**
   * user đang login
   */
  const [user, setUser] = useState<AuthUser | null>(null);

  /**
   * đọc localStorage mỗi lần đổi route
   */
  useEffect(() => {
    function syncUser() {
      setUser(getUser());
    }

    syncUser();

    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-change", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-change", syncUser);
    };
  }, [pathname]);

  /**
   * logout
   */
  function handleLogout() {
    clearAuth();

    setUser(null);

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

  /**
   * route profile theo role
   */
  let profilePath = "/profile";

  if (role.includes("admin") || role.includes("manager")) {
    profilePath = "/admin";
  } else if (role.includes("staff")) {
    profilePath = "/staff";
  } else if (role.includes("coach")) {
    profilePath = "/coach/profile";
  } else {
    profilePath = "/profile";
  }

  const isAdminOrStaff = role.includes("admin") || role.includes("manager") || role.includes("staff");

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

        {/* NAVIGATION */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? styles.active : ""}
              >
                {item.label}
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