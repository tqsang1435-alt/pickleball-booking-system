import { NextRequest } from "next/server";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { updateProfileSchema } from "./users.validation";
import * as usersService from "./users.service";

export async function getAllUsersController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const forbidden = requireRoles(auth, ["Admin"]);
    if (forbidden) return forbidden;

    const result = await usersService.getUsers();

    return successResponse(result, "Lấy danh sách người dùng thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getAllStaffController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const forbidden = requireRoles(auth, ["Admin"]);
    if (forbidden) return forbidden;

    const result = await usersService.getStaffUsers();

    return successResponse(result, "Lấy danh sách staff thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getMeController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await usersService.getMyProfile(auth.userId);

    return successResponse(result, "Lấy thông tin cá nhân thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function updateMeController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await validateBody(req, updateProfileSchema);
    const result = await usersService.editMyProfile(auth.userId, body);

    return successResponse(result, "Cập nhật hồ sơ thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getUserByIdController(req: NextRequest, userId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const forbidden = requireRoles(auth, ["Admin"]);
    if (forbidden) return forbidden;

    const result = await usersService.getUserDetail(userId);

    return successResponse(result, "Lấy thông tin người dùng thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function updateUserByIdController(req: NextRequest, userId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const forbidden = requireRoles(auth, ["Admin", "Manager"]);
    if (forbidden) return forbidden;

    const body = await validateBody(req, updateProfileSchema);
    const result = await usersService.editUserByAdmin(userId, body);

    return successResponse(result, "Cập nhật thông tin nhân viên thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function lockUserController(req: NextRequest, userId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const forbidden = requireRoles(auth, ["Admin"]);
    if (forbidden) return forbidden;

    const result = await usersService.lockUser(userId);

    return successResponse(result, "Khóa tài khoản thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function unlockUserController(req: NextRequest, userId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const forbidden = requireRoles(auth, ["Admin"]);
    if (forbidden) return forbidden;

    const result = await usersService.unlockUser(userId);

    return successResponse(result, "Mở khóa tài khoản thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminCreateStaffController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const forbidden = requireRoles(auth, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await req.json();

    const result = await usersService.createStaffByAdmin({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      password: body.password,
    });

    return successResponse(result, "Tạo tài khoản Staff thành công", 201);
  } catch (error) {
    return handleError(error);
  }
}
