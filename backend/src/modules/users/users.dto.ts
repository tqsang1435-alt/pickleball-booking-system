export type UpdateProfileDto = {
  fullName?: string;
  phoneNumber?: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  address?: string;
};

export type UpdateUserStatusDto = {
  status: "Active" | "Inactive" | "Locked";
};