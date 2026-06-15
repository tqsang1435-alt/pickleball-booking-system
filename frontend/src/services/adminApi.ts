import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/types/api";
import { getCourts } from "@/services/courtApi";
import { getDailyBookings, type DailyBooking } from "@/services/bookingApi";
import { adminGetAllCoaches } from "@/services/coachApi";
import { getAdminUsers } from "@/services/admin-users.service";
import { getAdminPromotions } from "@/services/promotionApi";

export type DashboardStats = {
  todayRevenue: number;
  todayBookingsCount: number;
  activeCourts: number;
  totalCourts: number;
  activeCoaches: number;
  activeStaff: number;
  activeCombos: number;
  activePromotions?: number;
  latestBookings: {
    BookingCode: string;
    PlayerName: string;
    PlayerEmail: string | null;
    PlayerPhone: string | null;
    ServiceType: string;
    CourtName: string | null;
    CoachName: string | null;
    StartTime: string | null;
    EndTime: string | null;
    Status: string;
    CreatedAt: string;
  }[];
};

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const res = await apiClient<ApiResponse<DashboardStats>>("/api/admin/dashboard", {
    token,
  });
  return res.data;
}

export type DashboardSnapshot = {
  stats: DashboardStats;
  dailyBookings: DailyBooking[];
  source: "api" | "collected" | "demo";
};

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function isActiveStatus(status?: string | null) {
  const value = String(status ?? "").toLowerCase();
  return ["active", "available", "approved"].includes(value);
}

function isEmptyStats(stats: DashboardStats) {
  return (
    stats.todayRevenue === 0 &&
    stats.todayBookingsCount === 0 &&
    stats.activeCourts === 0 &&
    stats.totalCourts === 0 &&
    stats.activeCoaches === 0 &&
    stats.activeStaff === 0 &&
    stats.activeCombos === 0 &&
    stats.latestBookings.length === 0
  );
}

function getEmptyStats(): DashboardStats {
  return {
    todayRevenue: 0,
    todayBookingsCount: 0,
    activeCourts: 0,
    totalCourts: 0,
    activeCoaches: 0,
    activeStaff: 0,
    activeCombos: 0,
    activePromotions: 0,
    latestBookings: [],
  };
}

function mergeStats(base: DashboardStats, fallback: Partial<DashboardStats>): DashboardStats {
  return {
    todayRevenue: base.todayRevenue || fallback.todayRevenue || 0,
    todayBookingsCount: base.todayBookingsCount || fallback.todayBookingsCount || 0,
    activeCourts: base.activeCourts || fallback.activeCourts || 0,
    totalCourts: base.totalCourts || fallback.totalCourts || 0,
    activeCoaches: base.activeCoaches || fallback.activeCoaches || 0,
    activeStaff: base.activeStaff || fallback.activeStaff || 0,
    activeCombos: base.activeCombos || fallback.activeCombos || 0,
    activePromotions: base.activePromotions || fallback.activePromotions || 0,
    latestBookings:
      base.latestBookings.length > 0
        ? base.latestBookings
        : fallback.latestBookings || [],
  };
}

function toLatestBooking(booking: DailyBooking): DashboardStats["latestBookings"][number] {
  return {
    BookingCode: booking.BookingCode,
    PlayerName: booking.PlayerName,
    PlayerEmail: booking.PlayerEmail,
    PlayerPhone: booking.PlayerPhone,
    ServiceType: booking.BookingType,
    CourtName: booking.CourtName,
    CoachName: booking.CoachName,
    StartTime: booking.StartTime,
    EndTime: booking.EndTime,
    Status: booking.Status,
    CreatedAt: booking.CreatedAt,
  };
}

const demoDailyBookings: DailyBooking[] = [
  {
    BookingID: 9001,
    BookingCode: "BK-DEMO-001",
    BookingType: "Court",
    BookingDate: todayStr(),
    StartTime: "07:00",
    EndTime: "08:30",
    TotalAmount: 180000,
    Status: "Confirmed",
    CheckInTime: null,
    PaymentDeadline: null,
    PlayerName: "Nguyen Minh Anh",
    PlayerEmail: "minhanh@example.com",
    PlayerPhone: "0901234567",
    CourtName: "San A1",
    CoachName: null,
    PaymentMethod: "Momo",
    PaymentStatus: "Paid",
    CreatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    BookingID: 9002,
    BookingCode: "BK-DEMO-002",
    BookingType: "Combo",
    BookingDate: todayStr(),
    StartTime: "09:00",
    EndTime: "10:30",
    TotalAmount: 420000,
    Status: "Paid",
    CheckInTime: null,
    PaymentDeadline: null,
    PlayerName: "Tran Hoang Nam",
    PlayerEmail: "hoangnam@example.com",
    PlayerPhone: "0912345678",
    CourtName: "San B2",
    CoachName: "Coach Huy",
    PaymentMethod: "VNPay",
    PaymentStatus: "Paid",
    CreatedAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
  },
  {
    BookingID: 9003,
    BookingCode: "BK-DEMO-003",
    BookingType: "Coach",
    BookingDate: todayStr(),
    StartTime: "16:00",
    EndTime: "17:00",
    TotalAmount: 250000,
    Status: "PendingPayment",
    CheckInTime: null,
    PaymentDeadline: null,
    PlayerName: "Le Gia Bao",
    PlayerEmail: "giabao@example.com",
    PlayerPhone: "0923456789",
    CourtName: null,
    CoachName: "Coach Linh",
    PaymentMethod: null,
    PaymentStatus: "Pending",
    CreatedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
  },
];

function getDemoSnapshot(): DashboardSnapshot {
  const todayRevenue = demoDailyBookings
    .filter((booking) => ["Paid", "Confirmed", "CheckedIn", "Completed"].includes(booking.Status))
    .reduce((sum, booking) => sum + booking.TotalAmount, 0);

  return {
    source: "demo",
    dailyBookings: demoDailyBookings,
    stats: {
      totalCourts: 8,
      activeCourts: 7,
      todayBookingsCount: demoDailyBookings.length,
      activeCoaches: 5,
      activeStaff: 4,
      activeCombos: 3,
      activePromotions: 3,
      todayRevenue,
      latestBookings: demoDailyBookings.map(toLatestBooking),
    },
  };
}

export function getDemoDashboardSnapshot(): DashboardSnapshot {
  return getDemoSnapshot();
}

export async function getDashboardSnapshot(token: string): Promise<DashboardSnapshot> {
  const [statsResult, dailyResult] = await Promise.allSettled([
    getDashboardStats(token),
    getDailyBookings(token, todayStr()),
  ]);

  const baseStats =
    statsResult.status === "fulfilled"
      ? statsResult.value
      : getEmptyStats();
  const dailyBookings = dailyResult.status === "fulfilled" ? dailyResult.value : [];

  const collectedResult = await Promise.allSettled([
    getCourts(),
    adminGetAllCoaches(token),
    getAdminUsers({ page: 1, limit: 100, roleName: "Staff" }),
    getAdminPromotions(token, { status: "Active" }),
  ]);

  const courts = collectedResult[0].status === "fulfilled" ? collectedResult[0].value : [];
  const coaches = collectedResult[1].status === "fulfilled" ? collectedResult[1].value : [];
  const staffPage = collectedResult[2].status === "fulfilled" ? collectedResult[2].value : null;
  const promotions = collectedResult[3].status === "fulfilled" ? collectedResult[3].value : [];

  const collectedStats = mergeStats(baseStats, {
    totalCourts: courts.length,
    activeCourts: courts.filter((court) => isActiveStatus(court.Status)).length,
    activeCoaches: coaches.filter((coach) => isActiveStatus(coach.Status)).length,
    activeStaff:
      staffPage?.items.filter((staff) => isActiveStatus(staff.status)).length ??
      staffPage?.pagination.total ??
      0,
    activeCombos: promotions.length,
    activePromotions: promotions.length,
    todayBookingsCount: dailyBookings.length,
    todayRevenue: dailyBookings
      .filter((booking) => ["Paid", "Confirmed", "CheckedIn", "Completed"].includes(booking.Status))
      .reduce((sum, booking) => sum + booking.TotalAmount, 0),
    latestBookings: dailyBookings.map(toLatestBooking),
  });

  if (isEmptyStats(collectedStats) && dailyBookings.length === 0) {
    return getDemoSnapshot();
  }

  return {
    source: isEmptyStats(baseStats) ? "collected" : "api",
    stats: collectedStats,
    dailyBookings,
  };
}
