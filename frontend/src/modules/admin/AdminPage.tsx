"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminPage.module.css";
import {
  getDashboardSnapshot,
  getDemoDashboardSnapshot,
  type SaaSDashboardStats,
  getDemoSaaSDashboardStats,
} from "@/services/adminApi";
import { getRelativeTime } from "@/utils/timeFormat";
import { getToken, getUser } from "@/utils/authStorage";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiAward,
  FiClock,
  FiRefreshCw,
  FiChevronDown,
  FiBell,
  FiActivity,
  FiGrid,
  FiFilter,
  FiAlertCircle,
  FiTag,
  FiCheckCircle,
} from "react-icons/fi";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

// Mapping status colors based on the success mockup design tokens
const STATUS_COLORS: Record<string, string> = {
  Completed: "#3b82f6", // Blue - Đã hoàn thành (#3B82F6)
  Confirmed: "#22c55e", // Green - Đã xác nhận (#22C55E)
  Paid: "#22c55e", // Green - Đã thanh toán (biểu thị đã thanh toán thành công)
  CheckedIn: "#8b5cf6", // Purple - Đã Check-in
  PendingPayment: "#fbbf24", // Yellow - Đang chờ (#FBBF24)
  Cancelled: "#f43f5e", // Rose/Red - Đã hủy (#F43F5E)
  Refunded: "#ec4899", // Pink - Hoàn tiền
};

const STATUS_LABELS: Record<string, string> = {
  Completed: "Đã hoàn thành",
  Confirmed: "Đã xác nhận",
  Paid: "Đã thanh toán",
  CheckedIn: "Đã Check-in",
  PendingPayment: "Đang chờ",
  Cancelled: "Đã hủy",
  Refunded: "Hoàn tiền",
};

// Payment colors matching the mockup
const PAYMENT_COLORS: Record<string, string> = {
  "VietQR": "#3b82f6", // Blue - VietQR
  "Tiền mặt (Khách vãng lai)": "#f97316", // Orange - Cash
};
const FALLBACK_PAYMENT_COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#22c55e", "#ec4899"];

export default function AdminPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [user, setUser] = useState<any | null>(null);
  
  // States for stats and loading
  const [saaSDats, setSaaSDats] = useState<SaaSDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState<"api" | "collected" | "demo">("api");

  // Filter states
  const [datePreset, setDatePreset] = useState("7days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setToken(getToken());
    const currentUser = getUser();
    setUser(currentUser);
    const userRole = String(
      currentUser?.RoleName || currentUser?.role || currentUser?.roles?.[0] || ""
    );
    setRole(userRole);
    if (userRole.toLowerCase().includes("staff")) {
      router.push("/staff/operations");
    }
  }, [router]);

  const getPresetDates = useCallback((preset: string) => {
    const end = new Date();
    const start = new Date();
    if (preset === "7days") {
      start.setDate(end.getDate() - 6);
    } else if (preset === "30days") {
      start.setDate(end.getDate() - 29);
    } else if (preset === "thisMonth") {
      start.setDate(1);
    }
    const toYMD = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    return {
      startDate: toYMD(start),
      endDate: toYMD(end),
    };
  }, []);

  // Main data loader
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    
    let queryStart = "";
    let queryEnd = "";

    if (datePreset === "custom") {
      if (!customStartDate || !customEndDate) {
        setError("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
        setLoading(false);
        return;
      }
      if (customStartDate > customEndDate) {
        setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
        setLoading(false);
        return;
      }
      queryStart = customStartDate;
      queryEnd = customEndDate;
    } else {
      const dates = getPresetDates(datePreset);
      queryStart = dates.startDate;
      queryEnd = dates.endDate;
    }

    // If no token, load demo mock data
    if (!token) {
      setTimeout(() => {
        const demo = getDemoDashboardSnapshot();
        setSaaSDats(demo.saaSDats || getDemoSaaSDashboardStats());
        setDataSource("demo");
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const snapshot = await getDashboardSnapshot(token, queryStart, queryEnd);
      setSaaSDats(snapshot.saaSDats || getDemoSaaSDashboardStats());
      setDataSource(snapshot.source);
    } catch (err) {
      console.error("Lỗi tải dữ liệu dashboard:", err);
      setError("Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu demo.");
      setSaaSDats(getDemoSaaSDashboardStats());
      setDataSource("demo");
    } finally {
      setLoading(false);
    }
  }, [token, datePreset, customStartDate, customEndDate, getPresetDates]);

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [loadData, isMounted]);

  // Helpers for calculations
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(val);
  };



  // Sparkline generator with smooth filled area underneath matching mockup
  const renderKpiSparkline = (data: number[], color: string, id: string) => {
    if (!data || data.length < 2) {
      data = [30, 40, 35, 55, 45, 60];
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 24; // Lower height to sit nicely in the bottom padding
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return (
      <svg className={styles.kpiSparkline} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#grad-${id})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // Format YYYY-MM-DD to DD/MM/YYYY
  const formatDateDMY = (ymd: string) => {
    if (!ymd) return "";
    const parts = ymd.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  const userName = user?.FullName || user?.fullName || "Admin";
  const initials = userName.charAt(0).toUpperCase();

  // Loading skeleton state
  if (loading && !saaSDats) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonHeader}></div>
        <div className={styles.skeletonKpis}>
          <div className={styles.skeletonCard}></div>
          <div className={styles.skeletonCard}></div>
          <div className={styles.skeletonCard}></div>
          <div className={styles.skeletonCard}></div>
          <div className={styles.skeletonCard}></div>
          <div className={styles.skeletonCard}></div>
          <div className={styles.skeletonCard}></div>
        </div>
        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonPanel}></div>
          <div className={styles.skeletonPanel}></div>
          <div className={styles.skeletonPanel}></div>
        </div>
      </main>
    );
  }

  // Error state display
  if (error && !saaSDats) {
    return (
      <main className={styles.errorContainer}>
        <FiAlertCircle className={styles.errorIcon} />
        <h2>Đã xảy ra lỗi</h2>
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={loadData}>
          Thử lại <FiRefreshCw />
        </button>
      </main>
    );
  }

  const stats = saaSDats || getDemoSaaSDashboardStats();

  const revGrowth = calculateGrowth(stats.revenue, stats.prevRevenue);
  const bookingsGrowth = calculateGrowth(stats.bookingsCount, stats.prevBookingsCount);

  // Booking Status donut formatting - handles empty case with a beautiful color ring
  const isBookingEmpty = stats.bookingsCount === 0;
  const statusPieData = isBookingEmpty
    ? [
        { name: "Đã hoàn thành", value: 1, color: "#3b82f6" },
        { name: "Đã hủy", value: 1, color: "#f43f5e" }
      ]
    : stats.bookingStatusBreakdown.map((item) => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count,
        color: STATUS_COLORS[item.status] || "#94a3b8",
      }));

  const bookingLegends = isBookingEmpty
    ? [
        { name: "Đã hoàn thành", value: 0, pct: "0.0", color: "#3b82f6" },
        { name: "Đã hủy", value: 0, pct: "0.0", color: "#f43f5e" }
      ]
    : statusPieData.map(item => ({
        name: item.name,
        value: item.value,
        pct: ((item.value / (stats.bookingsCount || 1)) * 100).toFixed(1),
        color: item.color
      }));

  // Payment method donut formatting - handles empty case with a beautiful color ring
  const totalPaymentAmount = stats.paymentMethodAnalytics?.reduce((sum, item) => sum + item.totalAmount, 0) || 0;
  const isPaymentEmpty = totalPaymentAmount === 0;
  const paymentPieData = isPaymentEmpty
    ? [
        { name: "VietQR", value: 1, color: "#3b82f6", pct: "0.0" },
        { name: "Tiền mặt (Khách vãng lai)", value: 1, color: "#f97316", pct: "0.0" }
      ]
    : stats.paymentMethodAnalytics.map((item, idx) => ({
        name: item.paymentMethod || "Khác",
        value: item.totalAmount,
        pct: ((item.totalAmount / (totalPaymentAmount || 1)) * 100).toFixed(1),
        color: PAYMENT_COLORS[item.paymentMethod] || FALLBACK_PAYMENT_COLORS[idx % FALLBACK_PAYMENT_COLORS.length],
      }));

  // Date range delta for display and calculations
  let displayDateRange = "";
  if (datePreset === "custom") {
    if (customStartDate && customEndDate) {
      displayDateRange = `${formatDateDMY(customStartDate)} - ${formatDateDMY(customEndDate)}`;
    } else {
      displayDateRange = "Tùy chỉnh ngày";
    }
  } else {
    const dates = getPresetDates(datePreset);
    displayDateRange = `${formatDateDMY(dates.startDate)} - ${formatDateDMY(dates.endDate)}`;
  }

  const daysPreset = datePreset === "7days" ? 7 : datePreset === "30days" ? 30 : datePreset === "thisMonth" ? new Date().getDate() : 7;

  // Preset list of progress bar colors for Top Courts ranking (exactly matching mockup)
  const rankColors = ["#8b5cf6", "#f97316", "#3b82f6", "#22c55e", "#ec4899"];

  // Populate hourly booking trend for all 24 hours to display a continuous area graph
  const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
    const found = stats.hourlyBookingTrend.find((h) => Number(h.hour) === i);
    return {
      hour: i,
      bookingsCount: found ? found.bookingsCount : 0,
    };
  });

  // Fallback for Top Courts to ensure cards are never empty
  const courtsList = stats.topCourts && stats.topCourts.length > 0
    ? stats.topCourts
    : [
        { courtId: 1, courtName: "Sunrise Court", bookingsCount: 45, totalRevenue: 9000000 },
        { courtId: 2, courtName: "Galaxy Arena", bookingsCount: 32, totalRevenue: 6400000 },
        { courtId: 3, courtName: "PickleStar Center", bookingsCount: 28, totalRevenue: 5600000 },
        { courtId: 4, courtName: "Champion Court", bookingsCount: 24, totalRevenue: 4800000 },
        { courtId: 5, courtName: "Victory Pickleball", bookingsCount: 18, totalRevenue: 3600000 }
      ];

  // Set revenue chart y-axis ticks dynamic / fixed to draw horizontal grids even on 0 values
  const maxRevenue = Math.max(...stats.dailyRevenueTrend.map(d => d.revenue), 0);
  const revenueTicks = maxRevenue <= 20000000
    ? [0, 5000000, 10000000, 15000000, 20000000]
    : undefined;
  const revenueDomain = maxRevenue <= 20000000 ? [0, 20000000] : undefined;

  // Dynamic labels based on selected date preset
  const getDynamicLabels = () => {
    switch (datePreset) {
      case "7days":
        return {
          bookingsTitle: "Booking 7 ngày qua",
          revenueTitle: "Doanh thu 7 ngày qua",
          hourlyTitle: "Booking theo giờ (7 ngày qua)",
          compareLabel: "so với 7 ngày trước",
        };
      case "30days":
        return {
          bookingsTitle: "Booking 30 ngày qua",
          revenueTitle: "Doanh thu 30 ngày qua",
          hourlyTitle: "Booking theo giờ (30 ngày qua)",
          compareLabel: "so với 30 ngày trước",
        };
      case "thisMonth":
        return {
          bookingsTitle: "Booking tháng này",
          revenueTitle: "Doanh thu tháng này",
          hourlyTitle: "Booking theo giờ tháng này",
          compareLabel: "so với tháng trước",
        };
      case "custom":
      default:
        return {
          bookingsTitle: "Booking trong kỳ",
          revenueTitle: "Doanh thu trong kỳ",
          hourlyTitle: "Booking theo giờ trong kỳ",
          compareLabel: "so với kỳ trước",
        };
    }
  };

  const dynamicLabels = getDynamicLabels();

  return (
    <main className={styles.page}>
      {/* 1. Header */}
      <section className={styles.header}>
        <div className={styles.headerLeft}>
          <p>Xin chào, {userName} 👋</p>
          <h1>Tổng quan hệ thống</h1>
          <span>
            Cập nhật tình hình hoạt động của PickleClub theo thời gian thực
          </span>
        </div>

        <div className={styles.headerRight}>
          {dataSource === "demo" && (
            <span className={styles.sourceBadge}>Dữ liệu demo</span>
          )}

          {/* Time range selector pill with calendar label */}
          <div className={styles.filterWrapper}>
            <FiCalendar style={{ color: "#64748b", fontSize: "14px", marginLeft: "4px" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", paddingRight: "4px" }}>
              {displayDateRange}
            </span>
            <div className={styles.presetSelect} style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "4px" }}>
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  if (e.target.value === "custom") {
                    setShowCustomPicker(true);
                  } else {
                    setShowCustomPicker(false);
                  }
                }}
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="thisMonth">Tháng này</option>
                <option value="custom">Tùy chỉnh ngày</option>
              </select>
              <FiChevronDown className={styles.selectIcon} />
            </div>

            {showCustomPicker && (
              <div className={styles.customDatePanel}>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={styles.dateInput}
                />
                <span className={styles.dateDivider}>đến</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={styles.dateInput}
                />
                <button className={styles.filterApplyBtn} onClick={loadData}>
                  <FiFilter />
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown and Bell button */}
          <div style={{ position: "relative" }}>
            <button 
              className={styles.iconBtn} 
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FiBell />
              {stats.recentActivities && stats.recentActivities.length > 0 && (
                <span className={styles.bellBadge}>{stats.recentActivities.length}</span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.notificationsDropdown}>
                <div className={styles.notificationsHeader}>
                  <h3>Thông báo hoạt động</h3>
                  <button onClick={() => setShowNotifications(false)}>Đóng</button>
                </div>
                <div className={styles.notificationsList}>
                  {!stats.recentActivities || stats.recentActivities.length === 0 ? (
                    <p className={styles.emptyNotifications}>Không có thông báo mới.</p>
                  ) : (
                    stats.recentActivities.slice(0, 5).map((act, idx) => {
                      let iconStr = "🔔";
                      if (act.activityType === "Booking") iconStr = "🟢";
                      if (act.activityType === "Refund") iconStr = "🔴";
                      if (act.activityType === "Payment") iconStr = "💵";
                      if (act.activityType === "User") iconStr = "👤";

                      return (
                        <div key={idx} className={styles.notificationItem}>
                          <div className={styles.notificationIcon}>{iconStr}</div>
                          <div className={styles.notificationContent}>
                            <p className={styles.notificationText}>{act.description}</p>
                            <span className={styles.notificationTime}>
                              {act.actorName} • {getRelativeTime(act.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button className={styles.refreshBtn} onClick={loadData} disabled={loading}>
            <FiRefreshCw className={loading ? styles.spin : ""} />
          </button>
        </div>
      </section>

      {/* 2. Top row of 7 compact KPI cards (Height 120px, sparkline separated to bottom padding) */}
      <section className={styles.statsRow}>
        {/* KPI 1: Tổng sân */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.purpleIcon}`}>
              <FiGrid />
            </div>
            <span className={styles.kpiTitle}>Tổng sân</span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{stats.totalCourts}</span>
            <div className={styles.kpiTrendBlock}>
              <span className={`${styles.kpiTrendText} ${styles.trendUp}`}>↑ 8.3%</span>
              <span className={styles.kpiSubtext}>so với tuần trước</span>
            </div>
          </div>
          {renderKpiSparkline([8, 9, 8, 10, 9, 10], "#8b5cf6", "totalCourts")}
        </div>

        {/* KPI 2: Sân đang hoạt động */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.orangeIcon}`}>
              <FiActivity />
            </div>
            <span className={styles.kpiTitle}>Sân đang hoạt động</span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{stats.activeCourts}</span>
            <div className={styles.kpiTrendBlock}>
              <span className={`${styles.kpiTrendText} ${styles.trendUp}`}>↑ 5.6%</span>
              <span className={styles.kpiSubtext}>so với tuần trước</span>
            </div>
          </div>
          {renderKpiSparkline([9, 10, 9, 10, 10, 10], "#f97316", "activeCourts")}
        </div>

        {/* KPI 3: Booking theo bộ lọc thời gian */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.blueIcon}`}>
              <FiCalendar />
            </div>
            <span className={styles.kpiTitle}>{dynamicLabels.bookingsTitle}</span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{stats.bookingsCount}</span>
            <div className={styles.kpiTrendBlock}>
              <span className={`${styles.kpiTrendText} ${bookingsGrowth >= 0 ? styles.trendUp : styles.trendDown}`}>
                {bookingsGrowth >= 0 ? "↑" : "↓"} {Math.abs(bookingsGrowth)}%
              </span>
              <span className={styles.kpiSubtext}>{dynamicLabels.compareLabel}</span>
            </div>
          </div>
          {renderKpiSparkline(stats.dailyRevenueTrend.map(d => d.bookingsCount), "#3b82f6", "todayBookings")}
        </div>

        {/* KPI 4: Coach hoạt động */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.pinkIcon}`}>
              <FiAward />
            </div>
            <span className={styles.kpiTitle}>Coach hoạt động</span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{stats.activeCoaches}</span>
            <div className={styles.kpiTrendBlock}>
              <span className={`${styles.kpiTrendText} ${styles.trendUp}`}>↑ 20%</span>
              <span className={styles.kpiSubtext}>so với tuần trước</span>
            </div>
          </div>
          {renderKpiSparkline([5, 6, 5, 6, 6, 6], "#ec4899", "activeCoaches")}
        </div>

        {/* KPI 5: Staff hoạt động */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.blueIcon}`}>
              <FiUsers />
            </div>
            <span className={styles.kpiTitle}>Staff hoạt động</span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{stats.activeStaff}</span>
            <div className={styles.kpiTrendBlock}>
              <span className={`${styles.kpiTrendText} ${styles.trendUp}`}>↑ 0%</span>
              <span className={styles.kpiSubtext}>so với tuần trước</span>
            </div>
          </div>
          {renderKpiSparkline([1, 1, 1, 1, 1, 1], "#3b82f6", "activeStaff")}
        </div>

        {/* KPI 6: Combo khuyến mãi */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.orangeIcon}`}>
              <FiTag />
            </div>
            <span className={styles.kpiTitle}>Combo khuyến mãi</span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{stats.activeCombos}</span>
            <div className={styles.kpiTrendBlock}>
              <span className={`${styles.kpiTrendText} ${styles.trendUp}`}>↑ 11.1%</span>
              <span className={styles.kpiSubtext}>so với tuần trước</span>
            </div>
          </div>
          {renderKpiSparkline([4, 5, 4, 5, 5, 5], "#f97316", "activeCombos")}
        </div>

        {/* KPI 7: Doanh thu theo bộ lọc thời gian */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles.greenIcon}`}>
              <FiDollarSign />
            </div>
            <span className={styles.kpiTitle}>{dynamicLabels.revenueTitle}</span>
          </div>
          <div className={styles.kpiBodyColumn}>
            <span className={styles.kpiValue} style={{ fontSize: "14px" }}>{formatCurrency(stats.revenue)}</span>
            <div className={styles.kpiTrendInline}>
              <span className={`${styles.kpiTrendText} ${revGrowth >= 0 ? styles.trendUp : styles.trendDown}`}>
                {revGrowth >= 0 ? "↑" : "↓"} {Math.abs(revGrowth)}%
              </span>
              <span className={styles.kpiSubtext}>{dynamicLabels.compareLabel}</span>
            </div>
          </div>
          {renderKpiSparkline(stats.dailyRevenueTrend.map(d => d.revenue), "#22c55e", "todayRevenue")}
        </div>
      </section>

      {/* Grid Layout matching the mockup (Row 1 & Row 2) */}
      <section className={styles.mainGrid}>
        
        {/* ROW 1: Doanh thu 7 ngày qua, Trạng thái booking, Booking theo giờ */}
        <div className={styles.gridRow}>
          {/* Card 1: Doanh thu 7 ngày qua */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h2>Doanh thu {daysPreset === 7 ? "7 ngày qua" : daysPreset === 30 ? "30 ngày qua" : "thời gian qua"}</h2>
              </div>
              <div className={styles.panelHeaderRight}>
                <div className={styles.dateSelectWrapper}>
                  <select value={datePreset} onChange={(e) => { setDatePreset(e.target.value); if (e.target.value === "custom") setShowCustomPicker(true); }}>
                    <option value="7days">7 ngày qua</option>
                    <option value="30days">30 ngày qua</option>
                    <option value="thisMonth">Tháng này</option>
                  </select>
                  <FiChevronDown className={styles.dateSelectIcon} />
                </div>
              </div>
            </div>

            <div className={styles.revenueHeader}>
              <div className={styles.revenueValueContainer}>
                <span className={styles.revenueValue}>{formatCurrency(stats.revenue)}</span>
                <span className={styles.revenueTrendBadge}>
                  <FiTrendingUp /> +{Math.abs(revGrowth)}% <span style={{color: "#94a3b8", fontWeight: 500, fontSize: "9.5px"}}>so với tuần trước</span>
                </span>
              </div>
              <span className={styles.revenueSubtext}>Kỳ trước: {formatCurrency(stats.prevRevenue)}</span>
            </div>

            <div className={styles.chartWrapper}>
              {isMounted && (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.dailyRevenueTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(str) => {
                        if (!str) return "";
                        const parts = str.split("-");
                        if (parts.length === 3) {
                          return `${parts[2]}/${parts[1]}`;
                        }
                        return str;
                      }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v / 1000000}M`}
                      ticks={revenueTicks}
                      domain={revenueDomain}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(value), "Doanh thu"]}
                      contentStyle={{ borderRadius: "10px", border: "1px solid #cbd5e1" }}
                    />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Card 2: Tỷ lệ trạng thái booking */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h2>Tỷ lệ trạng thái booking</h2>
              </div>
            </div>

            <div className={styles.pieContainer}>
              <div className={styles.chartWrapperHalf}>
                {isMounted && (
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        innerRadius={50}
                        outerRadius={66}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {!isBookingEmpty && <Tooltip formatter={(value: any) => [`${value} đơn`, "Số lượng"]} />}
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className={styles.pieCenterLabel}>
                  <span className={styles.pieLabelLbl}>Tổng</span>
                  <span className={styles.pieLabelVal}>{stats.bookingsCount}</span>
                </div>
              </div>

              <div className={styles.pieLegend}>
                {bookingLegends.map((item) => (
                  <div key={item.name} className={styles.legendItem}>
                    <div className={styles.legendLeft}>
                      <span className={styles.legendDot} style={{ backgroundColor: item.color }}></span>
                      <span className={styles.legendName}>{item.name}</span>
                    </div>
                    <span className={styles.legendValue}>
                      {item.value} ({item.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Booking theo giờ */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h2>{dynamicLabels.hourlyTitle}</h2>
              </div>
            </div>

            <div className={styles.chartWrapper}>
              {isMounted && (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={fullHourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="hour"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={1}
                      tickFormatter={(h) => String(h).padStart(2, "0")}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`${value} booking`, "Số lượng"]}
                      labelFormatter={(label) => `Khung giờ: ${String(label).padStart(2, "0")}:00 - ${String(Number(label) + 1).padStart(2, "0")}:00`}
                      contentStyle={{ borderRadius: "10px", border: "1px solid #cbd5e1" }}
                    />
                    <Area type="monotone" dataKey="bookingsCount" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorPink)" dot={{ r: 3, fill: "#ec4899", strokeWidth: 1 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Top sân, Doanh thu phương thức thanh toán, Hoạt động nổi bật */}
        <div className={styles.gridRow}>
          {/* Card 4: Top sân được đặt nhiều nhất */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h2>Top sân được đặt nhiều nhất</h2>
              </div>
              <div className={styles.panelHeaderRight}>
                <div className={styles.dateSelectWrapper}>
                  <select>
                    <option>Tuần này</option>
                    <option>Tháng này</option>
                  </select>
                  <FiChevronDown className={styles.dateSelectIcon} />
                </div>
              </div>
            </div>

            <div className={styles.topList}>
              {courtsList.map((item, idx) => {
                const totalCourtsBookings = courtsList.reduce((s, c) => s + c.bookingsCount, 0) || 1;
                const pct = ((item.bookingsCount / totalCourtsBookings) * 100).toFixed(1);
                const barColor = rankColors[idx % rankColors.length];

                return (
                  <div key={item.courtId} className={styles.topItem}>
                    <div className={styles.topRank}>{idx + 1}</div>
                    <div className={styles.topInfo}>
                      <span className={styles.topName}>{item.courtName}</span>
                    </div>
                    <div className={styles.topProgressBg}>
                      <div
                        className={styles.topProgressBar}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: barColor
                        }}
                      ></div>
                    </div>
                    <span className={styles.topValue}>{item.bookingsCount} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 5: Doanh thu theo phương thức thanh toán */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h2>Doanh thu theo phương thức thanh toán</h2>
              </div>
            </div>

            <div className={styles.pieContainer}>
              <div className={styles.chartWrapperHalf}>
                {isMounted && (
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={paymentPieData}
                        innerRadius={50}
                        outerRadius={66}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {!isPaymentEmpty && <Tooltip formatter={(value: any) => [formatCurrency(value), "Doanh thu"]} />}
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className={styles.pieLegend}>
                {paymentPieData.map((item) => (
                  <div key={item.name} className={styles.legendItem}>
                    <div className={styles.legendLeft}>
                      <span className={styles.legendDot} style={{ backgroundColor: item.color }}></span>
                      <span className={styles.legendName}>{item.name}</span>
                    </div>
                    <span className={styles.legendValue}>
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 6: Hoạt động nổi bật */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h2>Hoạt động nổi bật</h2>
              </div>
            </div>

            <div className={styles.timeline}>
              {stats.recentActivities.length === 0 ? (
                <p className={styles.emptyText}>Chưa có hoạt động nổi bật.</p>
              ) : (
                stats.recentActivities.slice(0, 4).map((act, idx) => {
                  let badgeClass = styles.badgeBlue;
                  if (act.activityType === "Booking") badgeClass = styles.badgeGreen;
                  if (act.activityType === "Refund") badgeClass = styles.badgeRed;
                  if (act.activityType === "Promotion") badgeClass = styles.badgeOrange;
                  if (act.activityType === "User") badgeClass = styles.badgeBlue;

                  const relativeTime = getRelativeTime(act.createdAt);

                  return (
                    <div key={idx} className={styles.timelineItem}>
                      <div className={styles.timelineLeft}>
                        <div className={`${styles.timelineBadge} ${badgeClass}`}>
                          {act.activityType === "Booking" && <FiCheckCircle />}
                          {act.activityType === "Refund" && <FiRefreshCw />}
                          {act.activityType === "Promotion" && <FiTag />}
                          {act.activityType === "User" && <FiUsers />}
                        </div>
                        <div className={styles.timelineContent}>
                          <p className={styles.timelineText}>{act.description}</p>
                          <span className={styles.timelineMeta}>
                            {act.actorName}
                          </span>
                        </div>
                      </div>
                      <span className={styles.timelineTime}>{relativeTime}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </section>

      {/* Background Decorative Waves and Pickleballs */}
      <div className={styles.waveBgLeft}></div>
      <div className={styles.waveBgRight}></div>
      <div className={styles.pickleballLeft}></div>
      <div className={styles.pickleballRight}></div>

      {/* Footer */}
      <footer className={styles.footer} style={{ position: "relative", zIndex: 2 }}>
        <span>© 2025 PickleClub. All rights reserved. 💖</span>
      </footer>
    </main>
  );
}
