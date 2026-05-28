export type RoleStatus = "Active" | "Inactive";

export type Role = {
  RoleID: number;
  RoleName: string;
  Description: string | null;
  Status: RoleStatus;
  CreatedAt: Date;
};

export type CreateRoleInput = {
  roleName: string;
  description?: string;
};

export type UpdateRoleInput = {
  roleName?: string;
  description?: string;
  status?: RoleStatus;
};

export type AssignRoleInput = {
  userId: number;
  roleId: number;
};