export interface Role {
  Id: number;
  RoleName: string;
  Status: "Active" | "Inactive";
  CreatedDate: Date;
  UpdatedDate?: Date | null;
}

export interface UserInfo {
  Id: number;
  FullName: string;
  Email: string;
  PhoneNumber: string | null;
  Status: "Active" | "Locked" | "Inactive"; // fix: IsLocked → Status
  LockReason: string | null;
  LastLoginAt: Date | null;
  Roles: string[];
}

export interface ListUsersResponse {
  data: UserInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LockAccountResponse {
  UserID: number;
  Email: string;
  Status: "Active" | "Locked";  // fix: IsLocked → Status
  LockReason: string | null;
}

export interface UserRole {
  UserId: number;
  RoleId: number;
  Role: {
    RoleName: string;
  };
}