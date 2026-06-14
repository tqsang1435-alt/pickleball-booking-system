export interface RoleOption {
  roleId: number;
  roleName: string;
}

export interface AdminRoleItem {
  roleId: number;
  roleName: string;
  RoleID: number;
  RoleName: string;
  Description: string | null;
  Status: "Active" | "Inactive";
  CreatedAt: string | null;
}

export interface AdminUserItem {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: string;
  createdAt: string | null;
  roles: RoleOption[];
}

export interface UserListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  roleName?: string;
}

export interface PaginatedAdminUsers {
  items: AdminUserItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminActor {
  userId: number;
  roleNames: string[];
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ReplaceRolesResult {
  user: AdminUserItem;
  previousRoles: RoleOption[];
}

export interface UpdateUserStatusResult {
  user: AdminUserItem;
  previousStatus: string;
}
