export type BookingStatus =
  | 'PendingPayment'
  | 'Confirmed'
  | 'CheckedIn'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow'
  | 'Refunded';

export interface UpcomingBooking {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  courtName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  canCheckIn: boolean;
}

export interface StaffDashboardStats {
  totalBookings: number;
  checkInsCount: number;
  todayRevenue: number;
  upcomingBookings: UpcomingBooking[];
  pendingCheckIns: UpcomingBooking[];
}

export interface DailyBookingItem {
  bookingId: number;
  bookingCode: string;
  bookingType: 'Court' | 'Coach' | 'Combo';
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  courtName: string | null;
  coachName: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: BookingStatus;
  checkInTime: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  isGuest: boolean;
  guestName?: string;
  guestPhone?: string;
  canCheckIn: boolean;
  canMarkNoShow: boolean;
  canComplete: boolean;
}

export interface BookingFilters {
  date: string;
  status: 'All' | BookingStatus;
  searchText: string;
}

export interface BookingDetailView {
  bookingId: number;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  courtName: string | null;
  coachName: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  courtFee: number;
  coachFee: number;
  discountAmount: number;
  status: BookingStatus;
  paymentMethod: string | null;
  paymentStatus: string | null;
  checkInTime: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  isGuest: boolean;
  guestName?: string;
  guestPhone?: string;
}

export interface CourtStatusItem {
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

export interface IncidentReport {
  incidentId: number;
  courtId: number;
  courtName: string;
  incidentType: 'Equipment' | 'CourtDamage' | 'Safety' | 'Other';
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'InReview' | 'Resolved';
  createdAt: string;
  staffName: string;
}

export interface CreateIncidentReportRequest {
  courtId: number;
  incidentType: 'Equipment' | 'CourtDamage' | 'Safety' | 'Other';
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
}
