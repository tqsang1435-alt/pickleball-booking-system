"use client";

import Link from "next/link";

import styles from "./AdminLayout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          🟢 PickleClub
        </div>

        <nav className={styles.nav}>
          <Link href="/admin">
            Tổng quan
          </Link>

          <Link href="/admin/courts">
            Sân
          </Link>

          <Link href="/admin/bookings">
            Quản lý Booking
          </Link>

          <Link href="/admin/prices">
            Bảng giá
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

          <Link href="/admin/news">
            Tin tức
          </Link>

          <Link href="/admin/events">
            Sự kiện
          </Link>

          <Link href="/admin/banners">
            Banner
          </Link>

          <Link href="/admin/revenue">
            Doanh thu
          </Link>

          <Link href="/admin/statistics">
            Thống kê
          </Link>

          <Link href="/admin/settings">
            Cài đặt
          </Link>

          <Link href="/admin/accounts">
            Tài khoản
          </Link>
        </nav>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}