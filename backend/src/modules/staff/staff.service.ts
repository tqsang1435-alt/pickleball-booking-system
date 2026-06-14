import {
  repoGetStaffDashboardStats,
  repoMarkBookingNoShow,
  repoMarkBookingCompleted,
  repoGetCourtStatusBoard,
  repoCreateIncidentReport,
  repoGetIncidentsByStaff,
} from "./staff.repository";

function getTodayStr(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

export async function getDashboardStats() {
  const today = getTodayStr();
  return repoGetStaffDashboardStats(today);
}

export async function markNoShow(bookingId: number, staffId: number) {
  await repoMarkBookingNoShow(bookingId, staffId);
  return { bookingId, status: 'NoShow' };
}

export async function markCompleted(bookingId: number, staffId: number) {
  await repoMarkBookingCompleted(bookingId, staffId);
  return { bookingId, status: 'Completed' };
}

export async function getCourtStatusBoard() {
  const today = getTodayStr();
  return repoGetCourtStatusBoard(today);
}

export async function createIncidentReport(data: {
  staffId: number;
  courtId: number;
  incidentType: string;
  description: string;
  urgency: string;
}) {
  return repoCreateIncidentReport(data);
}

export async function getMyIncidents(staffId: number) {
  return repoGetIncidentsByStaff(staffId);
}
