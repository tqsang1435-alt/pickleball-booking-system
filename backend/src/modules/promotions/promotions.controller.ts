// ==========================================
// promotions.controller.ts
// Request handlers for Promotion module
// ==========================================

import type { NextRequest } from "next/server";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import { successResponse, errorResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import * as service from "./promotions.service";
import {
  createPromotionSchema,
  updatePromotionSchema,
  updateStatusSchema,
  validatePromotionSchema,
  applyPromotionSchema,
  removePromotionSchema,
  assignUsersSchema,
} from "./promotions.validation";

// ── User Controllers ─────────────────────────────────────────────────────────

export async function getAllPromotionsController() {
  try {
    const result = await service.getAllPromotions();
    return successResponse(result, "Get promotions successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getMyPromotionsController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const bookingAmountStr = req.nextUrl.searchParams.get("bookingAmount");
    const bookingAmount =
      bookingAmountStr && !isNaN(Number(bookingAmountStr))
        ? Number(bookingAmountStr)
        : undefined;

    const result = await service.getMyPromotions(user.userId, bookingAmount);
    return successResponse(result, "Lấy danh sách voucher thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function validatePromotionController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const body = await req.json();
    const parsed = validatePromotionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const result = await service.validatePromotion(
      user.userId,
      parsed.data.promotionCode,
      parsed.data.bookingId
    );
    return successResponse(result, "Voucher hợp lệ");
  } catch (error) {
    return handleError(error);
  }
}

export async function applyPromotionController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const body = await req.json();
    const parsed = applyPromotionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const result = await service.applyPromotion(
      user.userId,
      parsed.data.bookingId,
      parsed.data.promotionCode
    );
    return successResponse(result, "Áp dụng voucher thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function removePromotionController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const body = await req.json();
    const parsed = removePromotionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const result = await service.removePromotion(user.userId, parsed.data.bookingId);
    return successResponse(result, "Đã gỡ voucher thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ── Admin Controllers ─────────────────────────────────────────────────────────

export async function adminGetPromotionsController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const params = req.nextUrl.searchParams;
    const filters = {
      status: params.get("status") ?? undefined,
      applyScope: params.get("applyScope") ?? undefined,
      discountType: params.get("discountType") ?? undefined,
      keyword: params.get("keyword") ?? undefined,
    };

    const result = await service.adminGetPromotions(filters);
    return successResponse(result, "Lấy danh sách voucher thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminCreatePromotionController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = createPromotionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const result = await service.adminCreatePromotion(parsed.data, user.userId);
    return successResponse(result, "Tạo voucher thành công", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function adminGetPromotionDetailController(req: NextRequest, id: number) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const result = await service.adminGetPromotionDetail(id);
    return successResponse(result, "Lấy chi tiết voucher thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminUpdatePromotionController(req: NextRequest, id: number) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = updatePromotionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const result = await service.adminUpdatePromotion(id, parsed.data);
    return successResponse(result, "Cập nhật voucher thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminUpdateStatusController(req: NextRequest, id: number) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const result = await service.adminUpdateStatus(id, parsed.data.status);
    return successResponse(result, "Cập nhật trạng thái thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminAssignUsersController(req: NextRequest, promotionId: number) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const body = await req.json();
    const parsed = assignUsersSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 400, parsed.error.issues);
    }

    const result = await service.adminAssignUsers(promotionId, parsed.data.userIds);
    return successResponse(result, "Gán voucher cho user thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminGetPromotionUsersController(req: NextRequest, promotionId: number) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const result = await service.adminGetPromotionUsers(promotionId);
    return successResponse(result, "Lấy danh sách user thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminRevokeUserController(
  req: NextRequest,
  promotionId: number,
  userId: number
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const result = await service.adminRevokeUser(promotionId, userId);
    return successResponse(result, "Thu hồi voucher thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function adminSearchUsersController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const roleErr = requireRoles(user, ["Admin", "Staff"]);
    if (roleErr) return roleErr;

    const keyword = req.nextUrl.searchParams.get("keyword") ?? "";
    const result = await service.adminSearchUsers(keyword);
    return successResponse(result, "Tìm kiếm user thành công");
  } catch (error) {
    return handleError(error);
  }
}