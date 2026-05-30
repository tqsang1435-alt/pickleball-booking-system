// ============================================================
// coaches.type.ts — Type definitions for Coaches module
// ============================================================

// ─── Status Types ────────────────────────────────────────────

export type CoachStatus = "Pending" | "Approved" | "Rejected" | "Inactive";

export type CoachScheduleStatus =
  | "Available"
  | "Holding"
  | "Booked"
  | "Cancelled"
  | "Unavailable";

export type SkillLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Professional";

// ─── Entity Types ─────────────────────────────────────────────

export type Coach = {
  CoachID: number;
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string | null;
  AvatarURL: string | null;
  ExperienceYears: number;
  SkillLevel: SkillLevel | null;
  Specialization: string | null;
  Certifications: string | null;
  HourlyRate: number;
  Biography: string | null;
  AverageRating: number;
  TotalStudents: number;
  Status: CoachStatus;
  CreatedAt?: string;
  UpdatedAt?: string | null;
};

export type CoachSchedule = {
  CoachScheduleID: number;
  CoachID: number;
  WorkingDate: string;       // YYYY-MM-DD
  StartTime: string;         // HH:mm
  EndTime: string;           // HH:mm
  Status: CoachScheduleStatus;
  HoldUntil?: string | null;
  CreatedAt?: string;
  UpdatedAt?: string | null;
};

// ─── Input Types ──────────────────────────────────────────────

export type CreateCoachScheduleInput = {
  coachId: number;
  workingDate: string;
  startTime: string;
  endTime: string;
};

export type UpdateCoachProfileInput = {
  experienceYears?: number;
  biography?: string | null;
  specialization?: string | null;
};

export type UpdateCoachExpertiseInput = {
  skillLevel?: SkillLevel;
  specialization?: string | null;
  certifications?: string | null;
  experienceYears?: number;
};

export type UpdateCoachFeeInput = {
  hourlyRate: number;
};

export type UpdateCoachScheduleInput = {
  workingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: CoachScheduleStatus;
};

export type UpdateCoachStatusInput = {
  status: CoachStatus;
};

// ─── Filter Types ─────────────────────────────────────────────

export type CoachListFilter = {
  skillLevel?: SkillLevel;
  specialization?: string;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
};