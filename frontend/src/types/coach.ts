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

export type Coach = {
  CoachID: number;
  UserID?: number;
  FullName: string;
  Email?: string;
  PhoneNumber?: string | null;
  AvatarURL: string | null;
  ExperienceYears: number;
  SkillLevel: SkillLevel | null;
  Specialization: string | null;
  Certifications?: string | null;
  HourlyRate: number;
  Biography: string | null;
  AverageRating: number;
  TotalStudents: number;
  Status: CoachStatus | string;
  CreatedAt?: string;
  UpdatedAt?: string | null;
};

export type CoachSchedule = {
  CoachScheduleID: number;
  CoachID: number;
  WorkingDate: string;
  StartTime: string;
  EndTime: string;
  Status: CoachScheduleStatus;
  HoldUntil?: string | null;
  isExpired?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string | null;
};
