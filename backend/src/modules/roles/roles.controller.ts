import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/utils/response";
import { validateBody } from "@/middlewares/validate.middleware";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import {
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
} from "./roles.validation";
import * as roleService from "./roles.service";

function handleRoleError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  switch (message) {
    case "ROLE_NOT_FOUND":
      return errorResponse("Không tìm thấy role", 404);

    case "ROLE_ALREADY_EXISTS":
      return errorResponse("Role đã tồn tại", 409);

    case "ROLE_NOT_FOUND_OR_INACTIVE":
      return errorResponse("Role không tồn tại hoặc đã bị khóa", 404);

    case "USER_ALREADY_HAS_ROLE":
      return errorResponse("User đã có role này", 409);

    case "USER_ROLE_LIMIT_EXCEEDED":
      return errorResponse("Một tài khoản chỉ được có tối đa 2 role", 400);

    default:
      return errorResponse("Lỗi hệ thống", 500);
  }
}

export async function getRolesController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin", "Manager"]);
    if (forbidden) return forbidden;

    const roles = await roleService.getRoles();

    return successResponse(roles, "Lấy danh sách role thành công");
  } catch (error) {
    return handleRoleError(error);
  }
}

export async function getRoleDetailController(req: NextRequest, roleId: number) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin", "Manager"]);
    if (forbidden) return forbidden;

    const role = await roleService.getRoleDetail(roleId);

    return successResponse(role, "Lấy chi tiết role thành công");
  } catch (error) {
    return handleRoleError(error);
  }
}

export async function createRoleController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await validateBody(req, createRoleSchema);
    const role = await roleService.createRole(body);

    return successResponse(role, "Tạo role thành công", 201);
  } catch (error) {
    return handleRoleError(error);
  }
}

export async function updateRoleController(req: NextRequest, roleId: number) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await validateBody(req, updateRoleSchema);
    const role = await roleService.updateRole(roleId, body);

    return successResponse(role, "Cập nhật role thành công");
  } catch (error) {
    return handleRoleError(error);
  }
}

export async function assignRoleController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await validateBody(req, assignRoleSchema);
    const result = await roleService.assignRole(body);

    return successResponse(result, "Gán role cho user thành công");
  } catch (error) {
    return handleRoleError(error);
  }
}

export async function removeRoleController(
  req: NextRequest,
  userId: number,
  roleId: number
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    await roleService.removeRole(userId, roleId);

    return successResponse(null, "Gỡ role khỏi user thành công");
  } catch (error) {
    return handleRoleError(error);
  }
}