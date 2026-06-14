import type {
  AssignRoleDto,
} from "./dto/assign-role.dto";

import type {
  LockAccountDto,
} from "./dto/lock-account.dto";

import {
  countActiveAdminsFromDB,
  getAdminUsersFromDB,
  getRolesFromDB,
  getUserByIdFromDB,
  replaceUserRolesInDB,
  updateUserStatusInDB,
} from "./roles.repository";

import type {
  AdminActor,
  AdminRoleItem,
  PaginatedAdminUsers,
  UserListFilters,
} from "./roles.type";

import {
  createSystemLog,
} from "@/modules/systemlogs/systemlogs.service";

function httpError(
  status: number,
  message: string
): Error {
  return Object.assign(
    new Error(message),
    {
      status,
    }
  );
}

export async function getAdminUsers(
  filters: UserListFilters
): Promise<PaginatedAdminUsers> {
  return getAdminUsersFromDB(filters);
}

export async function getAvailableRoles(): Promise<
  AdminRoleItem[]
> {
  return getRolesFromDB();
}

export async function assignRoles(
  actor: AdminActor,
  targetUserId: number,
  input: AssignRoleDto
) {
  const target =
    await getUserByIdFromDB(
      targetUserId
    );

  if (!target) {
    throw httpError(
      404,
      "Không tìm thấy người dùng"
    );
  }

  const actorIsAdmin =
    actor.roleNames.includes("Admin");

  const targetIsAdmin =
    target.roles.some(
      (role) =>
        role.roleName === "Admin"
    );

  if (
    targetIsAdmin &&
    !actorIsAdmin
  ) {
    throw httpError(
      403,
      "Manager không được thay đổi quyền của Admin"
    );
  }

  const availableRoles =
    await getRolesFromDB();

  const selectedRoles =
    availableRoles.filter(
      (role) =>
        input.roleIds.includes(
          role.RoleID
        )
    );

  if (
    selectedRoles.length !==
    input.roleIds.length
  ) {
    throw httpError(
      400,
      "Có quyền không tồn tại"
    );
  }

  const assigningAdmin =
    selectedRoles.some(
      (role) =>
        role.RoleName === "Admin"
    );

  if (
    assigningAdmin &&
    !actorIsAdmin
  ) {
    throw httpError(
      403,
      "Chỉ Admin được phép gán quyền Admin"
    );
  }

  const removingAdmin =
    targetIsAdmin &&
    !assigningAdmin;

  if (
    removingAdmin &&
    target.status === "Active"
  ) {
    const activeAdminCount =
      await countActiveAdminsFromDB();

    if (activeAdminCount <= 1) {
      throw httpError(
        409,
        "Không thể thu hồi quyền của Admin hoạt động cuối cùng"
      );
    }
  }

  const previousRoles =
    target.roles;

  await replaceUserRolesInDB(
    targetUserId,
    input.roleIds
  );

  const updatedUser =
    await getUserByIdFromDB(
      targetUserId
    );

  await writeAuditLogSafely({
    userId: actor.userId,
    action: "ASSIGN_ROLE",
    entityType: "User",
    entityId: targetUserId,
    description:
      `Cập nhật quyền cho ${target.fullName}`,
    oldValue: {
      roles: previousRoles,
    },
    newValue: {
      roles:
        updatedUser?.roles ?? [],
    },
    ipAddress:
      actor.ipAddress,
    userAgent:
      actor.userAgent,
  });

  return updatedUser;
}

export async function lockAccount(
  actor: AdminActor,
  targetUserId: number,
  input: LockAccountDto
) {
  if (
    actor.userId === targetUserId
  ) {
    throw httpError(
      409,
      "Bạn không thể tự khóa tài khoản của mình"
    );
  }

  const target =
    await getUserByIdFromDB(
      targetUserId
    );

  if (!target) {
    throw httpError(
      404,
      "Không tìm thấy người dùng"
    );
  }

  if (target.status === "Locked") {
    throw httpError(
      409,
      "Tài khoản đã bị khóa"
    );
  }

  const actorIsAdmin =
    actor.roleNames.includes("Admin");

  const targetIsAdmin =
    target.roles.some(
      (role) =>
        role.roleName === "Admin"
    );

  if (
    targetIsAdmin &&
    !actorIsAdmin
  ) {
    throw httpError(
      403,
      "Manager không được khóa tài khoản Admin"
    );
  }

  if (
    targetIsAdmin &&
    target.status === "Active"
  ) {
    const activeAdminCount =
      await countActiveAdminsFromDB();

    if (activeAdminCount <= 1) {
      throw httpError(
        409,
        "Không thể khóa Admin hoạt động cuối cùng"
      );
    }
  }

  await updateUserStatusInDB(
    targetUserId,
    "Locked"
  );

  const updatedUser =
    await getUserByIdFromDB(
      targetUserId
    );

  await writeAuditLogSafely({
    userId: actor.userId,
    action: "LOCK_USER",
    entityType: "User",
    entityId: targetUserId,
    description:
      input.reason
        ? `Khóa tài khoản: ${input.reason}`
        : "Khóa tài khoản người dùng",
    oldValue: {
      status: target.status,
    },
    newValue: {
      status: "Locked",
    },
    ipAddress:
      actor.ipAddress,
    userAgent:
      actor.userAgent,
  });

  return updatedUser;
}

export async function unlockAccount(
  actor: AdminActor,
  targetUserId: number
) {
  const target =
    await getUserByIdFromDB(
      targetUserId
    );

  if (!target) {
    throw httpError(
      404,
      "Không tìm thấy người dùng"
    );
  }

  if (target.status === "Active") {
    throw httpError(
      409,
      "Tài khoản đang hoạt động"
    );
  }

  const actorIsAdmin =
    actor.roleNames.includes("Admin");

  const targetIsAdmin =
    target.roles.some(
      (role) =>
        role.roleName === "Admin"
    );

  if (
    targetIsAdmin &&
    !actorIsAdmin
  ) {
    throw httpError(
      403,
      "Manager không được mở khóa tài khoản Admin"
    );
  }

  await updateUserStatusInDB(
    targetUserId,
    "Active"
  );

  const updatedUser =
    await getUserByIdFromDB(
      targetUserId
    );

  await writeAuditLogSafely({
    userId: actor.userId,
    action: "UNLOCK_USER",
    entityType: "User",
    entityId: targetUserId,
    description:
      "Mở khóa tài khoản người dùng",
    oldValue: {
      status: target.status,
    },
    newValue: {
      status: "Active",
    },
    ipAddress:
      actor.ipAddress,
    userAgent:
      actor.userAgent,
  });

  return updatedUser;
}

async function writeAuditLogSafely(
  input: Parameters<
    typeof createSystemLog
  >[0]
): Promise<void> {
  try {
    await createSystemLog(input);
  } catch (error) {
    console.error(
      "Không thể ghi audit log:",
      error
    );
  }
}
