"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/styles/Home.module.css";

type User = {
  userId: number;
  fullName: string;
  email: string;
  roles?: string[];
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        🏓 PickleBall
      </Link>

      <nav className={styles.navLinks}>
        <Link href="/">Trang chủ</Link>
        <Link href="/courts">Sân Pickleball</Link>
        <Link href="/coaches">Huấn luyện viên</Link>
        <Link href="/combo">Combo</Link>
        <Link href="/matching">Tìm người chơi</Link>
        <Link href="/promotions">Ưu đãi</Link>
        <Link href="/guide">Hướng dẫn</Link>
      </nav>

      <div className={styles.navActions}>
        <span>♡</span>
        <span>🔔</span>

        {user ? (
          <div className={styles.userBox}>
            <span className={styles.userName}>👤 {user.fullName}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link href="/login" className={styles.loginBtn}>
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}