// ============================================================
// coaches.controller.ts — HTTP Controllers for Coaches module
// Follows the same pattern as courts.controller.ts
// ============================================================

import { NextRequest } from "next/server";
import * as coachService from "./coaches.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import type { CoachListFilter } from "./coaches.type";

// ─── PUBLIC: List active coaches ──────────────────────────────

export async function getAllCoachesController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filter: CoachListFilter = {};

    const skillLevel = searchParams.get("skillLevel");
    if (skillLevel) filter.skillLevel = skillLevel as CoachListFilter["skillLevel"];

    const specialization = searchParams.get("specialization");
    if (specialization) filter.specialization = specialization;

    const minRate = searchParams.get("minRate");
    if (minRate) filter.minRate = Number(minRate);

    const maxRate = searchParams.get("maxRate");
    if (maxRate) filter.maxRate = Number(maxRate);

    const minRating = searchParams.get("minRating");
    if (minRating) filter.minRating = Number(minRating);

    const result = await coachService.getAllCoaches(filter);

    return successResponse(result, "Lấy danh sách Coach thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUBLIC: Coach detail ─────────────────────────────────────

export async function getCoachByIdController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const coachId = Number(id);

    if (!coachId || isNaN(coachId)) {
      throw new Error("coachId không hợp lệ");
    }

    const result = await coachService.getCoachById(coachId);

    return successResponse(result, "Lấy thông tin Coach thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUBLIC: Coach schedules ──────────────────────────────────

export async function getCoachSchedulesPublicController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const coachId = Number(id);

    if (!coachId || isNaN(coachId)) {
      throw new Error("coachId không hợp lệ");
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      throw new Error("Tham số date là bắt buộc (YYYY-MM-DD)");
    }

    const result = await coachService.getCoachAvailableSlots(coachId, date);

    return successResponse(result, "Lấy lịch Coach thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUBLIC: Available schedules ─────────────────────────────

export async function getAvailableCoachSchedulesController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const bookingDate = searchParams.get("bookingDate") || "";
    const startTime = searchParams.get("startTime") || "";
    const endTime = searchParams.get("endTime") || "";

    const result = await coachService.getAvailableCoachSchedules(
      bookingDate,
      startTime,
      endTime
    );

    return successResponse(result, "Lấy danh sách lịch Coach khả dụng thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Get my profile ───────────────────────────────

export async function getMyCoachProfileController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const result = await coachService.getMyCoachProfile(user.userId);

    return successResponse(result, "Lấy hồ sơ Coach thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Update my profile ───────────────────────────

export async function updateMyProfileController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const contentType = req.headers.get("content-type") || "";
    let experienceYears: number | undefined;
    let biography: string | undefined;
    let specialization: string | undefined;
    let avatarFile: File | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const expStr = formData.get("experienceYears");
      experienceYears = expStr !== null && expStr !== "" ? Number(expStr) : undefined;
      biography = formData.get("biography") !== null ? (formData.get("biography") as string) : undefined;
      specialization = formData.get("specialization") !== null ? (formData.get("specialization") as string) : undefined;
      const file = formData.get("avatar");
      if (file && (file as any).name) {
        avatarFile = file as File;
      }
    } else {
      const body = await req.json();
      experienceYears =
        body.experienceYears !== undefined
          ? Number(body.experienceYears)
          : undefined;
      biography = body.biography;
      specialization = body.specialization;
    }

    const result = await coachService.updateMyProfile(user.userId, {
      experienceYears,
      biography: biography !== undefined ? (biography === "" ? null : biography) : undefined,
      specialization: specialization !== undefined ? (specialization === "" ? null : specialization) : undefined,
    }, avatarFile);

    return successResponse(result, "Cập nhật hồ sơ thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Update my expertise ─────────────────────────

export async function updateMyExpertiseController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const contentType = req.headers.get("content-type") || "";
    let skillLevel: string | undefined;
    let specialization: string | undefined;
    let certifications: string | undefined;
    let experienceYears: number | undefined;
    let certFile: File | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      skillLevel = formData.get("skillLevel") !== null ? (formData.get("skillLevel") as string) : undefined;
      specialization = formData.get("specialization") !== null ? (formData.get("specialization") as string) : undefined;
      certifications = formData.get("certifications") !== null ? (formData.get("certifications") as string) : undefined;
      
      const expStr = formData.get("experienceYears");
      experienceYears = expStr !== null && expStr !== "" ? Number(expStr) : undefined;
      
      const file = formData.get("certificate");
      if (file && (file as any).name) {
        certFile = file as File;
      }
    } else {
      const body = await req.json();
      skillLevel = body.skillLevel;
      specialization = body.specialization;
      certifications = body.certifications;
      experienceYears =
        body.experienceYears !== undefined
          ? Number(body.experienceYears)
          : undefined;
    }

    const result = await coachService.updateMyExpertise(user.userId, {
      skillLevel: skillLevel as any,
      specialization: specialization !== undefined ? (specialization === "" ? null : specialization) : undefined,
      certifications: certifications !== undefined ? (certifications === "" ? null : certifications) : undefined,
      experienceYears,
    }, certFile);

    return successResponse(result, "Cập nhật chuyên môn thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Update teaching fee ─────────────────────────

export async function updateMyFeeController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const body = await req.json();

    if (body.hourlyRate === undefined) {
      throw new Error("hourlyRate là bắt buộc");
    }

    const result = await coachService.updateMyFee(user.userId, {
      hourlyRate: Number(body.hourlyRate),
    });

    return successResponse(result, "Cập nhật học phí thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Get my schedules ────────────────────────────

export async function getMySchedulesController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const result = await coachService.getMySchedules(user.userId);

    return successResponse(result, "Lấy danh sách lịch thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Create schedule ─────────────────────────────

export async function createMyScheduleController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const body = await req.json();

    if (!body.workingDate || !body.startTime || !body.endTime) {
      throw new Error("workingDate, startTime và endTime là bắt buộc");
    }

    const result = await coachService.createMySchedule(user.userId, {
      workingDate: body.workingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Tạo lịch thành công", 201);
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Update schedule ─────────────────────────────

export async function updateMyScheduleController(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const { scheduleId } = await context.params;
    const id = Number(scheduleId);

    if (!id || isNaN(id)) {
      throw new Error("scheduleId không hợp lệ");
    }

    const body = await req.json();

    const result = await coachService.updateMySchedule(user.userId, id, {
      workingDate: body.workingDate,
      startTime: body.startTime,
      endTime: body.endTime,
      status: body.status,
    });

    return successResponse(result, "Cập nhật lịch thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── AUTH COACH: Delete schedule ─────────────────────────────

export async function deleteMyScheduleController(
  req: NextRequest,
  context: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Coach"]);
    if (forbidden) return forbidden;

    const { scheduleId } = await context.params;
    const id = Number(scheduleId);

    if (!id || isNaN(id)) {
      throw new Error("scheduleId không hợp lệ");
    }

    const result = await coachService.deleteMySchedule(user.userId, id);

    return successResponse(result, "Xóa lịch thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── ADMIN: List all coaches ──────────────────────────────────

export async function getAllCoachesAdminController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const result = await coachService.getAllCoachesAdmin();

    return successResponse(result, "Lấy danh sách Coach thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── ADMIN: Pending coaches ───────────────────────────────────

export async function getPendingCoachesController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const result = await coachService.getPendingCoaches();

    return successResponse(result, "Lấy danh sách Coach chờ duyệt thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── ADMIN: Update coach status ───────────────────────────────

export async function updateCoachStatusController(
  req: NextRequest,
  context: { params: Promise<{ coachId: string }> }
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const { coachId } = await context.params;
    const id = Number(coachId);

    if (!id || isNaN(id)) {
      throw new Error("coachId không hợp lệ");
    }

    const body = await req.json();

    if (!body.status) {
      throw new Error("status là bắt buộc");
    }

    const result = await coachService.updateCoachStatus(id, body.status);

    return successResponse(result, "Cập nhật trạng thái Coach thành công");
  } catch (error) {
    return handleError(error);
  }
}