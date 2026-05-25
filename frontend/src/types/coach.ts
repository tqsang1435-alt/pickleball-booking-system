export type Coach = {
  CoachID: number;
  UserID?: number;
  FullName: string;
  Email?: string;
  PhoneNumber?: string | null;
  AvatarURL: string | null;
  ExperienceYears: number;
  SkillLevel: string;
  Specialization: string | null;
  Certifications?: string | null;
  HourlyRate: number;
  Biography: string | null;
  AverageRating: number;
  TotalStudents: number;
  Status: string;
};
