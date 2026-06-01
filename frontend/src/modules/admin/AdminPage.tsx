"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminPage.module.css";
import { getDashboardStats, DashboardStats } from "@/services/adminApi";
import { getDailyBookings, DailyBooking } from "@/services/bookingApi";
import { getToken, getUser } from "@/utils/authStorage";

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyBookings, setDailyBookings] = useState<DailyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentToken = getToken();
    const currentUser = getUser();
    setToken(currentToken);
    setRole(currentUser?.role);
  }, []);

  useEffect(() => {
    if (!token || !role) return;

    if (role.toLowerCase().includes("staff")) {
      router.push("/admin/bookings");
      return;
    }

    if (!role.toLowerCase().includes("admin") && !role.toLowerCase().includes("manager")) return;

    async function loadData() {
      try {
        const [statsData, dailyData] = await Promise.all([
          getDashboardStats(token as string),
          getDailyBookings(token as string), // Gets today's bookings
        ]);
        setStats(statsData);
        setDailyBookings(dailyData);
      } catch (err) {
        console.error("Lỗi tải dữ liệu dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, role]);

  // Nhóm các booking theo từng sân để vẽ lịch (giống bên Quản lý Booking)
  const courtSchedules: Record<string, DailyBooking[]> = {};
  dailyBookings.forEach(b => {
    if (b.BookingType === "Court" || b.BookingType === "Combo") {
      const courtName = b.CourtName || "Sân chưa rõ";
      if (!courtSchedules[courtName]) courtSchedules[courtName] = [];
      courtSchedules[courtName].push(b);
    }
  });
  const courts = Object.keys(courtSchedules).sort();

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p>Xin chào, Admin 👋</p>
          <h1>Quản trị hệ thống</h1>
          <span>
            Quản lý toàn bộ vận hành: sân, coach, doanh thu,
            khuyến mãi, chính sách hủy, phân quyền và bảo trì.
          </span>
        </div>

        <button onClick={() => window.location.reload()}>Làm mới</button>
      </section>

      <section className={styles.stats}>
        <div className={styles.card}>
          <span>💰</span>
          <h2>
            {stats
              ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.todayRevenue)
              : "..."}
          </h2>
          <p>Doanh thu hôm nay</p>
        </div>

        <div className={styles.card}>
          <span>📅</span>
          <h2>{stats ? stats.todayBookingsCount : "..."}</h2>
          <p>Lượt đặt sân</p>
        </div>

        <div className={styles.card}>
          <span>🎾</span>
          <h2>{stats ? stats.activeCourts : "..."}</h2>
          <p>Sân đang hoạt động</p>
        </div>

        <div className={styles.card}>
          <span>👨‍🏫</span>
          <h2>{stats ? stats.activeCoaches : "..."}</h2>
          <p>Coach đang hoạt động</p>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Lịch đặt sân hôm nay</h2>
            <button>Xem chi tiết</button>
          </div>

          <div className={styles.schedule}>
            {courts.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "16px" }}>Hôm nay chưa có sân nào được đặt.</p>
            ) : (
              courts.slice(0, 4).map((courtName) => (
                <div className={styles.row} key={courtName}>
                  <strong>{courtName}</strong>
                  <div className={styles.timeline}>
                    {/* Render blocks dựa trên lịch đặt */}
                    {courtSchedules[courtName].map(b => (
                      <span key={b.BookingID} className={styles.active} title={`${b.StartTime} - ${b.EndTime} | ${b.PlayerName}`} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <h2>Chức năng nhanh</h2>

          <div className={styles.quick}>
            <button>Thêm sân</button>
            <button>Tạo combo</button>
            <button>Thêm khuyến mãi</button>
            <button>Bảo trì sân</button>
            <button>Quản lý coach</button>
            <button>Phân quyền</button>
          </div>
        </div>

        <div className={styles.panel}>
          <h2>Đơn đặt mới nhất</h2>

          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách</th>
                <th>Sân</th>
                <th>Giờ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {!stats ? (
                <tr><td colSpan={5}>Đang tải...</td></tr>
              ) : stats.latestBookings.length === 0 ? (
                <tr><td colSpan={5}>Chưa có đơn đặt nào</td></tr>
              ) : (
                stats.latestBookings.map((b) => (
                  <tr key={b.BookingCode}>
                    <td>{b.BookingCode}</td>
                    <td>{b.PlayerName}</td>
                    <td>{b.CourtName}</td>
                    <td>{b.StartTime || "N/A"}</td>
                    <td>{b.Status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.panel}>
          <h2>Trạng thái vận hành</h2>

          <div className={styles.statusList}>
            <p>Sân hoạt động <strong>{stats ? `${stats.activeCourts}/${stats.totalCourts}` : "..."}</strong></p>
            <p>Coach hoạt động <strong>{stats ? stats.activeCoaches : "..."}</strong></p>
            <p>Combo đang bán <strong>{stats ? stats.activeCombos : "..."}</strong></p>
            <p>Khuyến mãi đang chạy <strong>{stats ? stats.activePromotions : "..."}</strong></p>
          </div>
        </div>
      </section>
    </main>
  );
}