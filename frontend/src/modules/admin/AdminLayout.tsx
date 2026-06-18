"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getUser } from "@/utils/authStorage";
import type { AuthUser } from "@/types/auth";
import {
  DashboardIcon, CourtIcon, CalendarIcon, OperationsIcon, ComboIcon,
  PlayerIcon, CoachIcon, StaffIcon, RevenueIcon, BarChartIcon,
  PromotionIcon, CheckShieldIcon, SettingsIcon
} from "./AdminIcons";

import styles from "./AdminLayout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

  const getInitials = (name: string) => {
    if (!name) return "A";
    return name.charAt(0).toUpperCase();
  };
  type NavItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
    hideForStaff?: boolean;
    staffOnly?: boolean;
  };
  const userName = user?.FullName || user?.fullName || "Admin";
  const userEmail = user?.Email || user?.email || "admin@pickleclub.vn";

  const navItems = [
    { href: "/admin", label: "Tổng quan", icon: <DashboardIcon />, hideForStaff: true },
    { href: "/admin/courts", label: "Sân", icon: <CourtIcon />, hideForStaff: true },
    { href: "/admin/bookings", label: "Quản lý Booking", icon: <CalendarIcon /> },
    { href: "/admin/refunds", label: "Quản lý Hoàn tiền", icon: <RevenueIcon />, hideForStaff: true },
    { href: "/staff/operations", label: "Vận hành hôm nay", icon: <OperationsIcon /> },
    { href: "/staff/bookings/walk-in", label: "Đặt sân trực tiếp", icon: <CalendarIcon />, staffOnly: true },
    { href: "/admin/combos", label: "Combo", icon: <ComboIcon />, hideForStaff: true },
    { href: "/admin/players", label: "Người chơi", icon: <PlayerIcon />, hideForStaff: true },
    { href: "/admin/coaches", label: "Coach", icon: <CoachIcon />, hideForStaff: true },
    { href: "/admin/staff", label: "Nhân viên", icon: <StaffIcon />, hideForStaff: true },
    { href: "/admin/events", label: "Sự kiện", icon: <CalendarIcon />, hideForStaff: true },
    { href: "/admin/revenue", label: "Doanh thu", icon: <RevenueIcon />, hideForStaff: true },
    { href: "/admin/reports", label: "Thống kê", icon: <BarChartIcon />, hideForStaff: true },
    { href: "/admin/promotions", label: "Khuyến mãi", icon: <PromotionIcon />, hideForStaff: true },
    { href: "/admin/permissions", label: "Phân quyền", icon: <CheckShieldIcon />, hideForStaff: true },
    { href: "/admin/settings", label: "Cài đặt hệ thống", icon: <SettingsIcon />, hideForStaff: true },
  ];

  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 9a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5h0a5 5 0 0 1-5-5V9z" fill="currentColor" opacity="0.2" />
              <path d="M7 9a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5h0a5 5 0 0 1-5-5V9z" />
              <path d="M12 17v5" strokeWidth="3.5" />
              <path d="M10 22h4" />
              <circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            PickleClub
          </Link>
        </div>


        <nav className={styles.nav}>
          {navItems.map((item) => {
            if (item.hideForStaff && isStaff) return null;
            if (item.staffOnly && !isStaff) return null;

            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? styles.active : ""}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.userProfileBottom}>
          <div className={styles.avatar}>
            {getInitials(userName)}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName} title={userName}>{userName}</span>
            <span className={styles.userEmail} title={userEmail}>{userEmail}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Đăng xuất"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}