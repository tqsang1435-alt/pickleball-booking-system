import { NextRequest } from "next/server";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import * as reportService from "./reports.service";

export async function getDashboardStatsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin"]);
    if (roleCheck) return roleCheck;

    const result = await reportService.getDashboardStats();

    return successResponse(result, "Lấy thống kê dashboard thành công");
  } catch (error) {
    return handleError(error);
  }
}
