// ============================================================
// coaches.service.ts — Business logic for Coaches module
// ============================================================

import * as coachRepo from "./coaches.repository";
import { validateAndSaveFile, deleteFile } from "../../utils/upload";
import bcrypt from "bcryptjs";
import type {
  CreateCoachAdminInput,
  UpdateCoachProfileInput,
  UpdateCoachExpertiseInput,
  UpdateCoachFeeInput,
  UpdateCoachScheduleInput,
  CoachListFilter,
  CoachStatus,
} from "./coaches.type";
import {
  validateTimeRange,
  validateNotPastDate,
  validateStartTimeInFuture,
  validateHourlyRate,
  validateExperienceYears,
  validateBiography,
  validateSpecialization,
  validateSkillLevel,
  validateCoachStatus,
  validateScheduleStatus,
  isValidDateFormat,
  isScheduleExpired,
} from "./coaches.validation";

// ─── PUBLIC: List active coaches ──────────────────────────────

export async function getAllCoaches(filter: CoachListFilter = {}) {
  return coachRepo.findAllApprovedCoaches(filter);
}

// ─── PUBLIC: Coach detail ─────────────────────────────────────

export async function getCoachById(coachId: number) {
  const coach = await coachRepo.findCoachById(coachId);

  if (!coach) {
    throw new Error("Coach không tồn tại hoặc chưa được duyệt");
  }

  return coach;
}

// ─── PUBLIC: Available schedules (for booking picker) ─────────

export async function getAvailableCoachSchedules(
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  if (!bookingDate) {
    throw new Error("bookingDate là bắt buộc");
  }

  if (!startTime || !endTime) {
    throw new Error("startTime và endTime là bắt buộc");
  }

  validateTimeRange(startTime, endTime);

  const schedules = await coachRepo.findAvailableCoachSchedules(bookingDate, startTime, endTime);
  
  // Filter out expired schedules
  return schedules.filter(s => !isScheduleExpired(s.WorkingDate, s.EndTime));
}

// ─── AUTH: Get my coach profile ───────────────────────────────

export async function getMyCoachProfile(userId: number) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  return coach;
}

// ─── AUTH: Update my profile ──────────────────────────────────

export async function updateMyProfile(
  userId: number,
  data: UpdateCoachProfileInput,
  avatarFile?: File
) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  // Validate
  if (data.experienceYears !== undefined) {
    validateExperienceYears(data.experienceYears);
  }
  if (data.biography !== undefined) {
    validateBiography(data.biography);
  }
  if (data.specialization !== undefined) {
    validateSpecialization(data.specialization);
  }

  let newAvatarPath: string | null = null;
  try {
    if (avatarFile) {
      newAvatarPath = await validateAndSaveFile(avatarFile, "avatar", coach.CoachID);
    }

    const updated = await coachRepo.updateCoachProfile(coach.CoachID, data);
    if (!updated) {
      throw new Error("Cập nhật hồ sơ thất bại");
    }

    if (newAvatarPath) {
      await coachRepo.updateUserAvatar(userId, newAvatarPath);
    }

    return updated;
  } catch (error) {
    if (newAvatarPath) {
      deleteFile(newAvatarPath);
    }
    throw error;
  }
}

// ─── AUTH: Update my expertise ────────────────────────────────

export async function updateMyExpertise(
  userId: number,
  data: UpdateCoachExpertiseInput,
  certFile?: File
) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  // Validate
  if (data.skillLevel !== undefined) {
    validateSkillLevel(data.skillLevel);
  }
  if (data.specialization !== undefined) {
    validateSpecialization(data.specialization);
  }
  if (data.experienceYears !== undefined) {
    validateExperienceYears(data.experienceYears);
  }

  let newCertPath: string | null = null;
  try {
    if (certFile) {
      newCertPath = await validateAndSaveFile(certFile, "certificate", coach.CoachID);
      data.certifications = newCertPath;
    }

    const updated = await coachRepo.updateCoachExpertise(coach.CoachID, data);
    if (!updated) {
      throw new Error("Cập nhật chuyên môn thất bại");
    }

    return updated;
  } catch (error) {
    if (newCertPath) {
      deleteFile(newCertPath);
    }
    throw error;
  }
}

// ─── AUTH: Update teaching fee ────────────────────────────────

export async function updateMyFee(
  userId: number,
  data: UpdateCoachFeeInput
) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  validateHourlyRate(data.hourlyRate);

  const updated = await coachRepo.updateCoachFee(coach.CoachID, data);

  if (!updated) {
    throw new Error("Cập nhật học phí thất bại");
  }

  return updated;
}

// ─── AUTH: Get my schedules ───────────────────────────────────

export async function getMySchedules(userId: number) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  const schedules = await coachRepo.findCoachSchedules(coach.CoachID);

  // Add isExpired flag
  return schedules.map(s => ({
    ...s,
    isExpired: isScheduleExpired(s.WorkingDate, s.EndTime),
  }));
}

// ─── AUTH: Create schedule ────────────────────────────────────

export async function createMySchedule(
  userId: number,
  data: {
    workingDate: string;
    startTime: string;
    endTime: string;
  }
) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  if (coach.Status !== "Approved") {
    throw new Error("Chỉ Coach đã được duyệt mới có thể tạo lịch làm việc");
  }

  // Validate date & time
  if (!data.workingDate || !isValidDateFormat(data.workingDate)) {
    throw new Error("workingDate không đúng định dạng YYYY-MM-DD");
  }

  validateNotPastDate(data.workingDate);
  validateStartTimeInFuture(data.workingDate, data.startTime);
  validateTimeRange(data.startTime, data.endTime);

  // Check overlap
  const hasOverlap = await coachRepo.checkScheduleOverlap(
    coach.CoachID,
    data.workingDate,
    data.startTime,
    data.endTime
  );

  if (hasOverlap) {
    throw new Error("Lịch bị trùng với lịch đã tồn tại. Vui lòng chọn khung giờ khác");
  }

  return coachRepo.createCoachSchedule({
    coachId: coach.CoachID,
    workingDate: data.workingDate,
    startTime: data.startTime,
    endTime: data.endTime,
  });
}

// ─── AUTH: Update my schedule ─────────────────────────────────

export async function updateMySchedule(
  userId: number,
  scheduleId: number,
  data: UpdateCoachScheduleInput
) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  // Verify ownership
  const existing = await coachRepo.findScheduleById(scheduleId);

  if (!existing) {
    throw new Error("Lịch không tồn tại");
  }

  if (existing.CoachID !== coach.CoachID) {
    throw new Error("Bạn không có quyền chỉnh sửa lịch này");
  }

  if (existing.Status === "Booked" || existing.Status === "Holding") {
    throw new Error("Không thể chỉnh sửa lịch đã được đặt hoặc đang giữ chỗ");
  }

  // Validate if provided
  if (data.workingDate) {
    if (!isValidDateFormat(data.workingDate)) {
      throw new Error("workingDate không đúng định dạng YYYY-MM-DD");
    }
    validateNotPastDate(data.workingDate);
  }

  const newDate = data.workingDate || existing.WorkingDate;
  const newStart = data.startTime || existing.StartTime;
  const newEnd = data.endTime || existing.EndTime;

  if (data.startTime || data.endTime || data.workingDate) {
    validateStartTimeInFuture(newDate, newStart);
    validateTimeRange(newStart, newEnd);
  }

  if (data.status !== undefined) {
    validateScheduleStatus(data.status);
  }

  // Check overlap for the new time
  if (data.workingDate || data.startTime || data.endTime) {
    const newDate = data.workingDate || existing.WorkingDate;
    const newStart = data.startTime || existing.StartTime;
    const newEnd = data.endTime || existing.EndTime;

    const hasOverlap = await coachRepo.checkScheduleOverlap(
      coach.CoachID,
      newDate,
      newStart,
      newEnd,
      scheduleId
    );

    if (hasOverlap) {
      throw new Error("Lịch bị trùng với lịch đã tồn tại. Vui lòng chọn khung giờ khác");
    }
  }

  const updated = await coachRepo.updateCoachSchedule(
    scheduleId,
    coach.CoachID,
    data
  );

  if (!updated) {
    throw new Error("Cập nhật lịch thất bại");
  }

  return updated;
}

// ─── AUTH: Delete my schedule ─────────────────────────────────

export async function deleteMySchedule(userId: number, scheduleId: number) {
  const coach = await coachRepo.findCoachByUserId(userId);

  if (!coach) {
    throw new Error("Hồ sơ Coach không tồn tại");
  }

  // Verify ownership
  const existing = await coachRepo.findScheduleById(scheduleId);

  if (!existing) {
    throw new Error("Lịch không tồn tại");
  }

  if (existing.CoachID !== coach.CoachID) {
    throw new Error("Bạn không có quyền xóa lịch này");
  }

  if (existing.Status === "Booked" || existing.Status === "Holding") {
    throw new Error("Không thể xóa lịch đã được đặt hoặc đang giữ chỗ");
  }

  const deleted = await coachRepo.deleteCoachSchedule(
    scheduleId,
    coach.CoachID
  );

  if (!deleted) {
    throw new Error("Xóa lịch thất bại");
  }

  return deleted;
}

// ─── ADMIN: List all coaches ──────────────────────────────────

export async function getAllCoachesAdmin() {
  return coachRepo.findAllCoachesAdmin();
}

// ─── ADMIN: Create coach directly ─────────────────────────────

export async function createCoachByAdmin(data: CreateCoachAdminInput) {
  // Validate input
  if (!data.fullName || !data.email) {
    const { AppError } = await import("@/utils/AppError");
    throw new AppError("Họ tên và email là bắt buộc", 400);
  }
  
  const password = data.password || "123456"; // Default password if not provided
  const cost = 12; // bcrypt cost >= 12 as requested
  const passwordHash = await bcrypt.hash(password, cost);
  
  const userId = await coachRepo.createCoachAdminTransaction({
    ...data,
    passwordHash
  });
  
  return userId;
}

// ─── ADMIN: Pending coaches ───────────────────────────────────

export async function getPendingCoaches() {
  return coachRepo.findPendingCoaches();
}

// ─── ADMIN: Approve/reject/suspend coach ─────────────────────

export async function updateCoachStatus(coachId: number, status: CoachStatus) {
  validateCoachStatus(status);

  const coach = await coachRepo.findCoachByIdAdmin(coachId);

  if (!coach) {
    throw new Error("Coach không tồn tại");
  }

  const updated = await coachRepo.updateCoachStatus(coachId, status);

  if (!updated) {
    throw new Error("Cập nhật trạng thái Coach thất bại");
  }

  console.log(
    `[ADMIN] Coach #${coachId} status updated: ${coach.Status} → ${status}`
  );

  return updated;
}

// ─── HELPERS (for future Booking integration) ─────────────────

/**
 * Check if a coach is available for a specific date/time window.
 * Returns true if the coach has an Available schedule covering the window.
 */
export async function checkCoachAvailable(
  coachId: number,
  workingDate: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const schedules = await coachRepo.findCoachSchedules(coachId);

  return schedules.some(
    (s) =>
      s.WorkingDate === workingDate &&
      s.StartTime <= startTime &&
      s.EndTime >= endTime &&
      s.Status === "Available"
  );
}

/**
 * Get all available time slots for a coach on a given date.
 */
export async function getCoachAvailableSlots(coachId: number, date: string) {
  const schedules = await coachRepo.findCoachSchedules(coachId);

  return schedules.filter(
    (s) => s.WorkingDate === date && s.Status === "Available" && !isScheduleExpired(s.WorkingDate, s.EndTime)
  );
}

// ─── INCOME ───────────────────────────────────────────────────

export async function getMyIncome(userId: number) {
  const coach = await coachRepo.findCoachByUserId(userId);
  if (!coach) {
    const { AppError } = await import("@/utils/AppError");
    throw new AppError("Không tìm thấy thông tin Coach", 404);
  }

  const rawSessions = await coachRepo.findCoachIncome(coach.CoachID);

  let totalWorkingHours = 0;
  let totalIncome = 0;
  const sessions = rawSessions.map((row) => {
    const hours = row.WorkingHours;
    const fee = row.CoachFee > 0 ? row.CoachFee : hours * row.HourlyRate;
    
    totalWorkingHours += hours;
    totalIncome += fee;

    return {
      bookingId: row.BookingID,
      bookingType: row.BookingType,
      playerName: row.PlayerName,
      workingDate: row.WorkingDate,
      startTime: row.StartTime,
      endTime: row.EndTime,
      workingHours: hours,
      coachFee: fee,
      status: row.Status,
      paymentStatus: 'Paid' // since status is Completed, we assume it's paid
    };
  });

  const monthlyMap: Record<string, { month: string; sessions: number; workingHours: number; income: number }> = {};
  
  for (const session of sessions) {
    // workingDate format: YYYY-MM-DD -> get YYYY-MM
    const month = session.workingDate.substring(0, 7);
    if (!monthlyMap[month]) {
      monthlyMap[month] = { month, sessions: 0, workingHours: 0, income: 0 };
    }
    monthlyMap[month].sessions += 1;
    monthlyMap[month].workingHours += session.workingHours;
    monthlyMap[month].income += session.coachFee;
  }

  const monthlyIncome = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));

  return {
    summary: {
      totalSessions: sessions.length,
      completedSessions: sessions.length, // Query only fetched completed
      totalWorkingHours: totalWorkingHours,
      totalIncome: totalIncome
    },
    monthlyIncome,
    sessions
  };
}

export async function getCoachSchedules(coachId: number) {
  return coachRepo.findCoachSchedules(coachId);
}