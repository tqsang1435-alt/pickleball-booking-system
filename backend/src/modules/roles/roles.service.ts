import * as roleRepo from "./roles.repository";
import type { CreateRoleInput, UpdateRoleInput, AssignRoleInput } from "./roles.type";

export async function getRoles() {
  return roleRepo.findAllRoles();
}

export async function getRoleDetail(roleId: number) {
  const role = await roleRepo.findRoleById(roleId);

  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }

  const permissions = await roleRepo.findPermissionsByRoleId(roleId);

  return {
    ...role,
    permissions,
  };
}

export async function createRole(data: CreateRoleInput) {
  const existed = await roleRepo.findRoleByName(data.roleName);

  if (existed) {
    throw new Error("ROLE_ALREADY_EXISTS");
  }

  return roleRepo.createRole(data);
}

export async function updateRole(roleId: number, data: UpdateRoleInput) {
  const role = await roleRepo.findRoleById(roleId);

  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }

  return roleRepo.updateRole(roleId, data);
}

export async function assignRole(data: AssignRoleInput) {
  const role = await roleRepo.findRoleById(data.roleId);

  if (!role || role.Status !== "Active") {
    throw new Error("ROLE_NOT_FOUND_OR_INACTIVE");
  }

  const existed = await roleRepo.checkUserRoleExists(data.userId, data.roleId);

  if (existed) {
    throw new Error("USER_ALREADY_HAS_ROLE");
  }

  const roleCount = await roleRepo.getUserRoleCount(data.userId);

  if (roleCount >= 2) {
    throw new Error("USER_ROLE_LIMIT_EXCEEDED");
  }

  return roleRepo.assignRoleToUser(data.userId, data.roleId);
}

export async function removeRole(userId: number, roleId: number) {
  return roleRepo.removeRoleFromUser(userId, roleId);
}