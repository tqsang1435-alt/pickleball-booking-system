"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminPage.module.css";
import { getDashboardStats, DashboardStats } from "@/services/adminApi";
import { getDailyBookings, DailyBooking } from "@/services/bookingApi";
import { getToken, getUser } from "@/utils/authStorage";
import { 
  CourtIcon, CalendarIcon, PlayerIcon, CoachIcon, StaffIcon, 
  RevenueIcon, BellIcon, RefreshIcon, ComboIcon, PromotionIcon, 
  WrenchIcon, CheckShieldIcon, BarChartIcon, MoreIcon 
} from "./AdminIcons";

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

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
        setLoading(true);
        // Load stats
        try {
          const statsData = await getDashboardStats(token as string);
          setStats(statsData);
        } catch (err) {
          console.error("Lỗi tải dữ liệu dashboard stats:", err);
        }
        
        // Load daily bookings
        try {
          const dailyData = await getDailyBookings(token as string, todayStr());
          setDailyBookings(dailyData);
        } catch (err) {
          console.error("Lỗi tải dữ liệu daily bookings:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, role]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "đã xác nhận":
      case "completed":
      case "hoàn thành":
      case "paid":
      case "checkedin":
        return <span className={`${styles.badge} ${styles.success}`}>{status}</span>;
      case "pendingpayment":
      case "chờ thanh toán":
        return <span className={`${styles.badge} ${styles.warning}`}>{status}</span>;
      case "cancelled":
      case "đã hủy":
      case "no-show":
      case "noshow":
        return <span className={`${styles.badge} ${styles.danger}`}>{status}</span>;
      default:
        return <span className={`${styles.badge} ${styles.success}`}>{status}</span>;
    }
  };

  const getTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return "Vừa xong";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Vừa xong";
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div className={styles.headerLeft}>
          <p>Xin chào, Admin 👋</p>
          <h1>Quản trị hệ thống</h1>
          <span>
            Quản lý toàn bộ vận hành: sân, coach, staff, booking, doanh thu, khuyến mãi, phân quyền và bảo trì.
          </span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} aria-label="Notifications">
            <BellIcon />
          </button>
          <div className={styles.avatar}>A</div>
          <button className={styles.refreshBtn} onClick={() => window.location.reload()}>
            <RefreshIcon /> Làm mới
          </button>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.green}`}>
              <CourtIcon />
            </div>
            <p className={styles.cardTitle}>Tổng sân</p>
          </div>
          <h2>{stats ? stats.totalCourts : 0}</h2>
          <p className={styles.cardSubtitle}>Sân trong hệ thống</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.orange}`}>
              <CourtIcon />
            </div>
            <p className={styles.cardTitle}>Sân đang hoạt động</p>
          </div>
          <h2>{stats ? stats.activeCourts : 0}</h2>
          <p className={styles.cardSubtitle}>Sẵn sàng đặt</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.purple}`}>
              <CalendarIcon />
            </div>
            <p className={styles.cardTitle}>Booking hôm nay</p>
          </div>
          <h2>{stats ? stats.todayBookingsCount : 0}</h2>
          <p className={styles.cardSubtitle}>Lượt đặt</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.pink}`}>
              <CoachIcon />
            </div>
            <p className={styles.cardTitle}>Coach hoạt động</p>
          </div>
          <h2>{stats ? stats.activeCoaches : 0}</h2>
          <p className={styles.cardSubtitle}>Huấn luyện viên</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.blue}`}>
              <StaffIcon />
            </div>
            <p className={styles.cardTitle}>Staff hoạt động</p>
          </div>
          <h2>{stats ? stats.activeStaff : 0}</h2>
          <p className={styles.cardSubtitle}>Nhân viên</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.cyan}`}>
              <ComboIcon />
            </div>
            <p className={styles.cardTitle}>Combo khuyến mãi</p>
          </div>
          <h2>{stats ? stats.activeCombos : 0}</h2>
          <p className={styles.cardSubtitle}>Đang kích hoạt</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.yellow}`}>
              <RevenueIcon />
            </div>
            <p className={styles.cardTitle}>Doanh thu hôm nay</p>
          </div>
          <h2>
            {stats
              ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.todayRevenue)
              : "0 ₫"}
          </h2>
          <p className={styles.cardSubtitle}>
            {stats && stats.todayBookingsCount > 0
              ? `Từ ${stats.todayBookingsCount} booking`
              : "Chưa có booking"}
          </p>
        </div>
      </section>

      <section className={styles.grid}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Lịch đặt sân hôm nay</h2>
              <button className={styles.viewDetailsBtn} onClick={() => router.push("/admin/bookings")}>Xem chi tiết</button>
            </div>
            
            {dailyBookings.length === 0 ? (
              <p style={{ color: "#6B7280", fontSize: "14px" }}>Hôm nay chưa có sân nào được đặt.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Sân / HLV</th>
                      <th>Khách hàng</th>
                      <th>Dịch vụ</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyBookings.slice(0, 5).map((b) => (
                      <tr key={b.BookingID}>
                        <td>{`${b.StartTime} - ${b.EndTime}`}</td>
                        <td>{b.CourtName || b.CoachName || "N/A"}</td>
                        <td>{b.PlayerName}</td>
                        <td>{b.BookingType}</td>
                        <td>{getStatusBadge(b.Status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Đơn đặt mới nhất</h2>
            </div>
            
            <div className={styles.latestList}>
              {!stats || stats.latestBookings.length === 0 ? (
                <p style={{ color: "#6B7280", fontSize: "14px" }}>Chưa có đơn đặt mới.</p>
              ) : (
                stats.latestBookings.map((b) => (
                  <div className={styles.latestItem} key={b.BookingCode}>
                    <div className={styles.latestCode}>Mã {b.BookingCode}</div>
                    <div className={styles.latestInfo}>
                      <div className={styles.latestName}>{b.PlayerName} - {b.ServiceType}</div>
                      <div className={styles.latestService}>
                        {b.ServiceType === 'Coach' ? (b.CoachName ? `HLV: ${b.CoachName}` : "Khu vực HLV") : (b.CourtName || "N/A")} • {b.StartTime ? `${b.StartTime} - ${b.EndTime}` : "Chưa xếp lịch"}
                      </div>
                    </div>
                    <div className={styles.latestRight}>
                      {getStatusBadge(b.Status)}
                      <div className={styles.latestTime}>{getTimeAgo(b.CreatedAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className={styles.panel}>
            <h2>Chức năng nhanh</h2>
            <div className={styles.quick}>
              <button className={`${styles.quickBtn} ${styles.quickGreen}`} onClick={() => router.push("/admin/courts")}>
                <CourtIcon /> <span>Thêm sân</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickPurple}`} onClick={() => router.push("/admin/combos")}>
                <ComboIcon /> <span>Tạo combo</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickPink}`} onClick={() => router.push("/admin/promotions")}>
                <PromotionIcon /> <span>Thêm khuyến mãi</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickRed}`} onClick={() => router.push("/admin/courts")}>
                <WrenchIcon /> <span>Bảo trì sân</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickBlue}`} onClick={() => router.push("/admin/coaches")}>
                <CoachIcon /> <span>Quản lý coach</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickIndigo}`} onClick={() => router.push("/admin/staff")}>
                <StaffIcon /> <span>Staff</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickOrange}`} onClick={() => router.push("/admin/permissions")}>
                <CheckShieldIcon /> <span>Phân quyền</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickYellow}`} onClick={() => router.push("/admin/reports")}>
                <BarChartIcon /> <span>Báo cáo thống kê</span>
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Trạng thái vận hành</h2>
              <MoreIcon className={styles.statusIcon} style={{ color: "#6B7280", cursor: "pointer" }} />
            </div>

            <div className={styles.statusList}>
              <div className={styles.statusItem}>
                <div className={styles.statusItemLeft}>
                  <div className={styles.statusIconWrapper} style={{ backgroundColor: '#DCFCE7' }}>
                    <CourtIcon className={styles.iconGreen} />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusName}>Sân</span>
                    <span className={styles.statusCount}>{stats ? `${stats.activeCourts}/${stats.totalCourts}` : 0} sân</span>
                  </div>
                </div>
                <div className={styles.statusActive}>
                  <span className={styles.dot}></span> Hoạt động
                </div>
              </div>

              <div className={styles.statusItem}>
                <div className={styles.statusItemLeft}>
                  <div className={styles.statusIconWrapper} style={{ backgroundColor: '#FCE7F3' }}>
                    <CoachIcon className={styles.iconPink} />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusName}>Coach</span>
                    <span className={styles.statusCount}>{stats ? stats.activeCoaches : 0} coach</span>
                  </div>
                </div>
                <div className={styles.statusActive}>
                  <span className={styles.dot}></span> Hoạt động
                </div>
              </div>

              <div className={styles.statusItem}>
                <div className={styles.statusItemLeft}>
                  <div className={styles.statusIconWrapper} style={{ backgroundColor: '#DBEAFE' }}>
                    <StaffIcon className={styles.iconBlue} />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusName}>Staff</span>
                    <span className={styles.statusCount}>{stats ? stats.activeStaff : 0} staff</span>
                  </div>
                </div>
                <div className={styles.statusActive}>
                  <span className={styles.dot}></span> Hoạt động
                </div>
              </div>

              <div className={styles.statusItem}>
                <div className={styles.statusItemLeft}>
                  <div className={styles.statusIconWrapper} style={{ backgroundColor: '#F3E8FF' }}>
                    <PromotionIcon className={styles.iconPurple} />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusName}>Khuyến mãi</span>
                    <span className={styles.statusCount}>{stats ? stats.activeCombos : 0} khuyến mãi</span>
                  </div>
                </div>
                <div className={styles.statusActive}>
                  <span className={styles.dot}></span> Hoạt động
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}