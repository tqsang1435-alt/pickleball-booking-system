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

  const userName = user?.FullName || user?.fullName || "Admin";
  const userEmail = user?.Email || user?.email || "admin@pickleclub.vn";

  const navItems = [
    { href: "/admin", label: "Tổng quan", icon: <DashboardIcon />, hideForStaff: true },
    { href: "/admin/courts", label: "Sân", icon: <CourtIcon />, hideForStaff: true },
    { href: "/admin/bookings", label: "Quản lý Booking", icon: <CalendarIcon /> },
    { href: "/admin/refunds", label: "Quản lý Hoàn tiền", icon: <RevenueIcon /> },
    { href: "/staff/operations", label: "Vận hành", icon: <OperationsIcon /> },
    { href: "/admin/combos", label: "Combo", icon: <ComboIcon /> },
    { href: "/admin/players", label: "Người chơi", icon: <PlayerIcon /> },
    { href: "/admin/coaches", label: "Coach", icon: <CoachIcon /> },
    { href: "/admin/staff", label: "Staff", icon: <StaffIcon /> },
    { href: "/admin/events", label: "Sự kiện", icon: <CalendarIcon /> },
    { href: "/admin/revenue", label: "Doanh thu", icon: <RevenueIcon />, hideForStaff: true },
    { href: "/admin/statistics", label: "Thống kê", icon: <BarChartIcon />, hideForStaff: true },
    { href: "/admin/promotions", label: "Khuyến mãi", icon: <PromotionIcon /> },
    { href: "/admin/permissions", label: "Phân quyền", icon: <CheckShieldIcon /> },
    { href: "/admin/settings", label: "Cài đặt hệ thống", icon: <SettingsIcon /> },
  ];

  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
            </svg>
          </div>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            PickleClub
          </Link>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            if (item.hideForStaff && isStaff) return null;
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