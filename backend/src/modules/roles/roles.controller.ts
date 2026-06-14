import {
  NextRequest,
} from "next/server";

import {
  requireAuth,
} from "@/middlewares/auth.middleware";

import {
  requireRoles,
} from "@/middlewares/role.middleware";

import {
  handleError,
} from "@/middlewares/error";

import {
  successResponse,
} from "@/utils/response";

import {
  validateAssignRoleDto,
} from "./dto/assign-role.dto";

import {
  validateLockAccountDto,
} from "./dto/lock-account.dto";

import {
  validateUserListDto,
} from "./dto/list-users.dto";

import type {
  AdminActor,
} from "./roles.type";

import * as roleService
  from "./roles.service";

import {
  getRoleByIdFromDB,
  createRoleInDB,
  updateRoleInDB,
  countUsersWithRoleFromDB,
  deleteRoleFromDB,
} from "./roles.repository";

import {
  createRoleSchema,
  updateRoleSchema,
} from "./roles.validation";

export async function getUsersController(
  req: NextRequest
) {
  try {
    const auth =
      authorizeAdmin(req);

    if (auth instanceof Response) {
      return auth;
    }

    const validation =
      validateUserListDto(
        req.nextUrl.searchParams
      );

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          message:
            validation.message,
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await roleService.getAdminUsers(
        validation.data
      );

    return successResponse(
      result,
      "Lấy danh sách người dùng thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getRolesController(
  req: NextRequest
) {
  try {
    const auth =
      authorizeAdmin(req);

    if (auth instanceof Response) {
      return auth;
    }

    const result =
      await roleService.getAvailableRoles();

    return successResponse(
      result,
      "Lấy danh sách quyền thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function assignRolesController(
  req: NextRequest,
  userId: number
) {
  try {
    const actor =
      authorizeAdmin(req);

    if (actor instanceof Response) {
      return actor;
    }

    const body: unknown =
      await req.json();

    const validation =
      validateAssignRoleDto(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          message:
            validation.message,
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await roleService.assignRoles(
        actor,
        userId,
        validation.data
      );

    return successResponse(
      result,
      "Cập nhật quyền thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function lockUserController(
  req: NextRequest,
  userId: number
) {
  try {
    const actor =
      authorizeAdmin(req);

    if (actor instanceof Response) {
      return actor;
    }

    const body = await req
      .json()
      .catch(() => ({}));

    const validation =
      validateLockAccountDto(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          message:
            validation.message,
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await roleService.lockAccount(
        actor,
        userId,
        validation.data
      );

    return successResponse(
      result,
      "Khóa tài khoản thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function unlockUserController(
  req: NextRequest,
  userId: number
) {
  try {
    const actor =
      authorizeAdmin(req);

    if (actor instanceof Response) {
      return actor;
    }

    const result =
      await roleService.unlockAccount(
        actor,
        userId
      );

    return successResponse(
      result,
      "Mở khóa tài khoản thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}

function authorizeAdmin(
  req: NextRequest
): AdminActor | Response {
  const auth =
    requireAuth(req);

  if (auth instanceof Response) {
    return auth;
  }

  const roleCheck =
    requireRoles(
      auth,
      [
        "Admin",
        "Manager",
      ]
    );

  if (roleCheck) {
    return roleCheck;
  }

  const authData =
    auth as Record<
      string,
      unknown
    >;

  const userId = Number(
    authData.userId ??
      authData.UserID ??
      authData.id ??
      authData.sub
  );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return Response.json(
      {
        success: false,
        message:
          "Không xác định được người dùng đăng nhập",
      },
      {
        status: 401,
      }
    );
  }

  return {
    userId,

    roleNames:
      extractRoleNames(authData),

    ipAddress:
      getClientIp(req),

    userAgent:
      req.headers.get(
        "user-agent"
      ),
  };
}

function extractRoleNames(
  auth: Record<string, unknown>
): string[] {
  const result: string[] = [];

  const rawRoles =
    auth.roles ??
    auth.roleNames;

  if (Array.isArray(rawRoles)) {
    for (const role of rawRoles) {
      if (typeof role === "string") {
        result.push(role);
      } else if (
        typeof role === "object" &&
        role !== null
      ) {
        const roleData =
          role as Record<
            string,
            unknown
          >;

        const name =
          roleData.roleName ??
          roleData.RoleName ??
          roleData.name;

        if (typeof name === "string") {
          result.push(name);
        }
      }
    }
  }

  const singleRole =
    auth.role ??
    auth.RoleName;

  if (typeof singleRole === "string") {
    result.push(singleRole);
  }

  return [
    ...new Set(result),
  ];
}

function getClientIp(
  req: NextRequest
): string | null {
  const forwarded =
    req.headers.get(
      "x-forwarded-for"
    );

  if (forwarded) {
    return (
      forwarded
        .split(",")[0]
        ?.trim() ?? null
    );
  }

  return req.headers.get(
    "x-real-ip"
  );
}

// ── Role CRUD controllers ─────────────────────────────────────────────────────

const PROTECTED_ROLES = ["Admin", "Manager", "Staff", "Coach", "Player", "Guest"];

export async function getRoleDetailController(req: NextRequest, roleId: number) {
  try {
    const auth = authorizeAdmin(req);
    if (auth instanceof Response) return auth;

    const role = await getRoleByIdFromDB(roleId);
    if (!role) {
      return Response.json({ success: false, message: "Không tìm thấy quyền" }, { status: 404 });
    }

    return successResponse(role, "Lấy thông tin quyền thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function createRoleController(req: NextRequest) {
  try {
    const auth = authorizeAdmin(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));
    const validation = createRoleSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          message: validation.error.issues[0]?.message ?? "Role data is invalid",
        },
        { status: 400 }
      );
    }

    const role = await createRoleInDB({
      roleName: validation.data.roleName.trim(),
      description: validation.data.description?.trim() || undefined,
    });

    return successResponse(role, "Tao quyen thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function updateRoleController(req: NextRequest, roleId: number) {
  try {
    const auth = authorizeAdmin(req);
    if (auth instanceof Response) return auth;

    const role = await getRoleByIdFromDB(roleId);
    if (!role) {
      return Response.json({ success: false, message: "Không tìm thấy quyền" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          message: validation.error.issues[0]?.message ?? "Role data is invalid",
        },
        { status: 400 }
      );
    }

    await updateRoleInDB(roleId, {
      roleName: validation.data.roleName?.trim(),
      description: validation.data.description?.trim() || undefined,
      status: validation.data.status,
    });
    const updated = await getRoleByIdFromDB(roleId);

    return successResponse(updated, "Cập nhật quyền thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteRoleController(req: NextRequest, roleId: number) {
  try {
    const auth = authorizeAdmin(req);
    if (auth instanceof Response) return auth;

    const role = await getRoleByIdFromDB(roleId);
    if (!role) {
      return Response.json({ success: false, message: "Không tìm thấy quyền" }, { status: 404 });
    }

    if (PROTECTED_ROLES.includes(role.RoleName)) {
      return Response.json(
        { success: false, message: `Không thể xóa quyền hệ thống "${role.RoleName}"` },
        { status: 403 }
      );
    }

    const userCount = await countUsersWithRoleFromDB(roleId);
    if (userCount > 0) {
      return Response.json(
        { success: false, message: `Không thể xóa quyền đang có ${userCount} người dùng` },
        { status: 409 }
      );
    }

    await deleteRoleFromDB(roleId);
    return successResponse({ roleId }, "Xóa quyền thành công");
  } catch (error) {
    return handleError(error);
  }
}
