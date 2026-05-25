export type Profile = {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  AvatarURL?: string | null;
  Gender?: string | null;
  DateOfBirth?: string | null;
  Address?: string | null;
  Status: string;
};

export type UpdateProfilePayload = {
  fullName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  address: string;
};

export type BookingHistory = {
  BookingID: number;
  BookingCode: string;
  BookingType: string;
  BookingDate: string;
  TotalAmount: number;
  BookingStatus: string;
  PaymentStatus: string;
  CheckInStatus: string;
};