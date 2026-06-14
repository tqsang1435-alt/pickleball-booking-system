import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/utils/response";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import * as settingsService from "./settings.service";
import * as settingsRepo from "./settings.repository";

function handleError(error: unknown) {
  const msg = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  switch (msg) {
    case "SETTING_NOT_FOUND":     return errorResponse("Không tìm thấy cấu hình", 404);
    case "SETTING_NOT_EDITABLE":  return errorResponse("Cấu hình này không thể chỉnh sửa", 403);
    default:                      return errorResponse("Lỗi hệ thống", 500);
  }
}

// GET /api/admin/settings  — trả về grouped settings
export async function getSettingsController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const forbidden = requireRoles(user, ["Admin", "Manager"]);
    if (forbidden) return forbidden;

    const data = await settingsService.getAllGrouped();
    return successResponse(data, "Lấy cấu hình thành công");
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/settings  — cập nhật 1 key
// body: { key: string; value: any }
export async function updateSettingController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await req.json() as { key?: string; value?: unknown };
    if (!body.key) return errorResponse("Thiếu trường key", 400);

    const updated = await settingsService.updateSetting(body.key, body.value, user.userId);
    return successResponse(updated, "Cập nhật cấu hình thành công");
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/settings/batch  — cập nhật nhiều key cùng lúc
// body: { settings: { key: string; value: any }[] }
export async function batchUpdateSettingsController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await req.json() as { settings?: { key: string; value: unknown }[] };
    if (!Array.isArray(body.settings) || body.settings.length === 0) {
      return errorResponse("Thiếu dữ liệu settings", 400);
    }

    await settingsService.updateBatch(body.settings, user.userId);
    return successResponse(null, "Lưu cấu hình thành công");
  } catch (error) {
    return handleError(error);
  }
}

// GET  /api/admin/settings/seed  — kiểm tra trạng thái seed
// POST /api/admin/settings/seed  — seed data mới (chỉ insert thiếu)
// POST /api/admin/settings/seed  với body { reset: true } — reset toàn bộ về default
export async function getSeedStatusController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const count = await settingsRepo.countSettings();
    return successResponse(
      { seeded: count > 0, count, total: 25 },
      "Lấy trạng thái seed thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function runSeedController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;
    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await req.json().catch(() => ({})) as { reset?: boolean };

    if (body.reset) {
      const result = await settingsRepo.reseedAllSettings();
      return successResponse(result, `Reset thành công ${result.total} cấu hình về giá trị mặc định`);
    } else {
      const result = await settingsRepo.seedAllSettings();
      return successResponse(
        result,
        result.inserted > 0
          ? `Seed thành công: thêm ${result.inserted} cấu hình mới, bỏ qua ${result.skipped} đã tồn tại`
          : `Tất cả ${result.skipped} cấu hình đã tồn tại, không cần seed thêm`
      );
    }
  } catch (error) {
    return handleError(error);
  }
}
