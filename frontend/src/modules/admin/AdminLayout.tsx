"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getUser } from "@/utils/authStorage";
import type { AuthUser } from "@/types/auth";

import styles from "./AdminLayout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const role = String(user?.RoleName || user?.role || user?.roles?.[0] || "").toLowerCase();
  const isStaff = role.includes("staff");

  function handleLogout() {
    clearAuth();
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
    router.refresh();
  }

  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            🟢 PickleClub
          </Link>
        </div>

        <nav className={styles.nav}>
          {!isStaff && (
            <>
              <Link href="/admin">
                Tổng quan
              </Link>

              <Link href="/admin/courts">
                Sân
              </Link>
            </>
          )}

          <Link href="/admin/bookings">
            Quản lý Booking
          </Link>

          <Link href="/admin/combos">
            Combo
          </Link>

          <Link href="/admin/players">
            Người chơi
          </Link>

          <Link href="/admin/coaches">
            Coach
          </Link>

          <Link href="/admin/events">
            Sự kiện
          </Link>

          {!isStaff && (
            <>
              <Link href="/admin/revenue">
                Doanh thu
              </Link>

              <Link href="/admin/statistics">
                Thống kê
              </Link>
            </>
          )}

        </nav>

        <div className={styles.userProfileBottom}>
          <span className={styles.userName}>
            {user?.FullName || user?.fullName || user?.Email || user?.email || "Admin"}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutBtnOutlined}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}