// ============================================================
// coaches.dto.ts — Data Transfer Objects for Coaches module
// Defines the shape of input data for each operation
// ============================================================

import type { CoachStatus, CoachScheduleStatus, SkillLevel } from "./coaches.type";

// ─── Profile DTOs ─────────────────────────────────────────────

export type UpdateCoachProfileDto = {
  experienceYears?: number;
  biography?: string | null;
  specialization?: string | null;
};

// ─── Expertise DTOs ───────────────────────────────────────────

export type UpdateCoachExpertiseDto = {
  skillLevel?: SkillLevel;
  specialization?: string | null;
  certifications?: string | null;
  experienceYears?: number;
};

// ─── Fee DTOs ─────────────────────────────────────────────────

export type UpdateCoachFeeDto = {
  hourlyRate: number;
};

// ─── Schedule DTOs ────────────────────────────────────────────

export type CreateCoachScheduleDto = {
  workingDate: string;  // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
};

export type UpdateCoachScheduleDto = {
  workingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: CoachScheduleStatus;
};

// ─── Admin DTOs ───────────────────────────────────────────────

export type UpdateCoachStatusDto = {
  status: CoachStatus;
};
