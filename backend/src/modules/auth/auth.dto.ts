export type RegisterDto = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  address?: string;
};

export type LoginDto = {
  email: string;
  password: string;
};