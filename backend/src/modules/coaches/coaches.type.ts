export type CoachStatus = "Pending" | "Approved" | "Rejected" | "Inactive";

export type Coach = {
  CoachID: number;
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string | null;
  AvatarURL: string | null;
  ExperienceYears: number;
  SkillLevel: "Beginner" | "Intermediate" | "Advanced" | "Professional";
  Specialization: string | null;
  Certifications: string | null;
  HourlyRate: number;
  Biography: string | null;
  AverageRating: number;
  TotalStudents: number;
  Status: CoachStatus;
};

export type CreateCoachScheduleInput = {
  coachId: number;
  workingDate: string;
  startTime: string;
  endTime: string;
};

export type CoachSchedule = {
  CoachScheduleID: number;
  CoachID: number;
  WorkingDate: string;
  StartTime: string;
  EndTime: string;
  Status: "Available" | "Holding" | "Booked" | "Cancelled" | "Unavailable";
};