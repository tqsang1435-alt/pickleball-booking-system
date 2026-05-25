export type RegisterInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  address?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUser = {
  UserID?: number;
  userId?: number;
  FullName?: string;
  fullName?: string;
  Email?: string;
  email?: string;
  RoleName?: string;
  role?: string;
  roles?: string[];
};