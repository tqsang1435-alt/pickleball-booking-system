import { NextRequest } from "next/server";

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
  errorResponse,
  successResponse,
} from "@/utils/response";
import {
  getAdminRevenue,
  parseRevenueQuery,
} from "@/modules/revenue/revenue.service";

export async function GET(
  req: NextRequest
) {
  try {
    const auth =
      requireAuth(req);

    if (
      auth instanceof Response
    ) {
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

    let query;

    try {
      query =
        parseRevenueQuery(
          req.nextUrl.searchParams
        );
    } catch (error) {
      return errorResponse(
        error instanceof Error
          ? error.message
          : "Bộ lọc doanh thu không hợp lệ",
        400
      );
    }

    const result =
      await getAdminRevenue(
        query
      );

    return successResponse(
      result,
      "Lấy dữ liệu doanh thu thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}
