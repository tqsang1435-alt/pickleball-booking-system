export type UpdateProfileDto = {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
};

export type UpdateUserStatusDto = {
  status: "Active" | "Inactive" | "Locked";
};

