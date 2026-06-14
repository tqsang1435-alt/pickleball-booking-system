export interface CustomerSearchResult {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface CourtAvailability {
  courtId: number;
  courtName: string;
  courtCode: string;
  courtImage: string | null;
  location: string | null;
  status: string;
  hourlyRate: number;
  hasAvailability: boolean;
}

export interface TimeSlotAvailability {
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
}

export interface WalkInBookingFormData {
  courtId: number | null;
  bookingDate: string;
  startTime: string | null;
  endTime: string | null;
  customerId: number | null;
  guestName: string;
  guestPhone: string;
  paymentMethod: 'Cash' | 'BankTransfer';
  calculatedPrice: number;
}

export interface WalkInBookingRequest {
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerId?: number;
  guestName?: string;
  guestPhone?: string;
  paymentMethod: 'Cash' | 'BankTransfer';
}

export interface WalkInBookingResponse {
  bookingId: number;
  bookingCode: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

export interface PriceCalculation {
  courtFee: number;
  durationHours: number;
  totalAmount: number;
}
