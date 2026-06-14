export interface StaffDashboardStatsResult {
  totalBookings: number;
  checkInsCount: number;
  todayRevenue: number;
  upcomingBookings: {
    bookingId: number;
    bookingCode: string;
    customerName: string;
    courtName: string;
    startTime: string;
    endTime: string;
    status: string;
    canCheckIn: boolean;
  }[];
  pendingCheckIns: {
    bookingId: number;
    bookingCode: string;
    customerName: string;
    courtName: string;
    startTime: string;
    endTime: string;
    status: string;
    canCheckIn: boolean;
  }[];
}

export interface CourtStatusResult {
  courtId: number;
  courtName: string;
  courtCode: string;
  currentStatus: 'Available' | 'InUse' | 'Upcoming' | 'Empty';
  activeBooking: {
    bookingId: number;
    bookingCode: string;
    customerName: string;
    startTime: string;
    endTime: string;
    minutesRemaining: number;
  } | null;
  upcomingBooking: {
    bookingId: number;
    bookingCode: string;
    customerName: string;
    startTime: string;
    minutesUntilStart: number;
  } | null;
}

export interface IncidentReportResult {
  incidentId: number;
  courtId: number;
  courtName: string;
  incidentType: string;
  description: string;
  urgency: string;
  status: string;
  createdAt: string;
  staffName: string;
}
