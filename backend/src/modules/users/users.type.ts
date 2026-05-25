export type UserStatus = "Active" | "Inactive" | "Locked";

export type UserRole = "Guest" | "Player" | "Coach" | "Staff" | "Admin";

export type UserProfile = {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string;
  Gender: string | null;
  DateOfBirth: string | null;
  Address: string | null;
  Status: UserStatus;
  CreatedAt: string;
  UpdatedAt: string | null;
  Roles?: string;
};