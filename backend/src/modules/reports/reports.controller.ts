import {
  NextRequest,
} from "next/server";

import {
  successResponse,
} from "@/utils/response";

import {
  handleError,
} from "@/middlewares/error";

import {
  requireAuth,
} from "@/middlewares/auth.middleware";

import {
  requireRoles,
} from "@/middlewares/role.middleware";

import {
  validateExportReportDto,
} from "./dto/export-report.dto";

import * as reportService
  from "./reports.service";

interface AuthUser {
  userId?: number;
  UserID?: number;
  id?: number;
  sub?: number | string;
}

function getAuthenticatedUserId(
  auth: unknown
): number {
  const user =
    auth as AuthUser;

  const userId = Number(
    user.userId ??
      user.UserID ??
      user.id ??
      user.sub
  );

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    throw new Error(
      "Không xác định được người dùng đăng nhập"
    );
  }

  return userId;
}

export async function getDashboardStatsController(
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

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let result;
    if (startDate && endDate) {
      result = await reportService.getSaaSDashboardStats(startDate, endDate);
    } else {
      result = await reportService.getDashboardStats();
    }

    return successResponse(
      result,
      "Lấy thống kê dashboard thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function exportReportController(
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

    let body: unknown;

    try {
      body =
        await req.json();
    } catch {
      return Response.json(
        {
          success: false,

          message:
            "Request body không hợp lệ",
        },
        {
          status: 400,
        }
      );
    }

    const validation =
      validateExportReportDto(
        body
      );

    if (
      !validation.success
    ) {
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

    const exportedBy =
      getAuthenticatedUserId(
        auth
      );

    const result =
      await reportService
        .exportReport(
          validation.data,
          exportedBy
        );

    const encodedFilename =
      encodeURIComponent(
        result.filename
      );

    return new Response(
      new Uint8Array(
        result.data
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            result.contentType,

          "Content-Disposition":
            `attachment; filename="${result.filename}"; ` +
            `filename*=UTF-8''${encodedFilename}`,

          "Content-Length":
            String(
              result.data
                .byteLength
            ),

          "Cache-Control":
            "no-store",

          "X-Report-Row-Count":
            String(
              result.rowCount
            ),
        },
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getReportExportHistoryController(
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

    const rawLimit =
      req.nextUrl.searchParams.get(
        "limit"
      );

    const parsedLimit =
      Number(
        rawLimit ?? "50"
      );

    const limit =
      Number.isFinite(
        parsedLimit
      )
        ? Math.min(
            Math.max(
              Math.trunc(
                parsedLimit
              ),
              1
            ),
            100
          )
        : 50;

    const result =
      await reportService
        .getReportExportHistory(
          limit
        );

    return successResponse(
      result,
      "Lấy lịch sử xuất báo cáo thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}