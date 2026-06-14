export interface RoleOption {
  roleId: number;
  roleName: string;
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

export interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}