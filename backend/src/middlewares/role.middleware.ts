import { errorResponse } from "@/utils/response";
import type { JwtPayload } from "@/modules/auth/auth.type";

export function requireRoles(user: JwtPayload, allowedRoles: string[]) {
  const hasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    return errorResponse("Bạn không có quyền truy cập chức năng này", 403);
  }

  return null;
}