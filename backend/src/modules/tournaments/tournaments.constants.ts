// ============================================================
// tournaments.constants.ts
// Constants for the Tournament module
// ============================================================

export const TOURNAMENT_STATUS = {
  DRAFT: "Draft",
  OPEN: "Open",
  REGISTRATION_CLOSED: "RegistrationClosed",
  SCHEDULED: "Scheduled",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const DIVISION_STATUS = {
  DRAFT: "Draft",
  OPEN: "Open",
  REGISTRATION_CLOSED: "RegistrationClosed",
  DRAW_GENERATED: "DrawGenerated",
  SCHEDULED: "Scheduled",
  ONGOING: "Ongoing",
  GROUP_COMPLETED: "GroupCompleted",
  KNOCKOUT_STAGE: "KnockoutStage",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const COMPETITION_FORMAT = {
  MEN_SINGLES: "MenSingles",
  WOMEN_SINGLES: "WomenSingles",
  MEN_DOUBLES: "MenDoubles",
  WOMEN_DOUBLES: "WomenDoubles",
  MIXED_DOUBLES: "MixedDoubles",
} as const;

export const GENDER_REQUIREMENT = {
  MALE_ONLY: "MaleOnly",
  FEMALE_ONLY: "FemaleOnly",
  MIXED: "Mixed",
} as const;

export const AGE_GROUP = {
  YOUTH: "Youth",
  OPEN: "Open",
  SENIOR50: "Senior50",
  SENIOR60: "Senior60",
} as const;

export const BRACKET_TYPE = {
  SINGLE_ELIMINATION: "SingleElimination",
  ROUND_ROBIN: "RoundRobin",
  GROUP_KNOCKOUT: "GroupKnockout",
} as const;

export const TEAM_STATUS = {
  DRAFT: "Draft",
  PENDING_MEMBER_CONFIRM: "PendingMemberConfirm",
  LOOKING_FOR_PARTNER: "LookingForPartner",
  AUTO_MATCHING: "AutoMatching",
  TEAM_CONFIRMED: "TeamConfirmed",
  PENDING_PAYMENT: "PendingPayment",
  REGISTERED: "Registered",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ELIMINATED: "Eliminated",
  WINNER: "Winner",
} as const;

export const JOIN_STATUS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  REMOVED: "Removed",
} as const;

export const REGISTRATION_STATUS = {
  PENDING_PAYMENT: "PendingPayment",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  WAITLISTED: "Waitlisted",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
} as const;

export const MATCH_STATUS = {
  SCHEDULED: "Scheduled",
  READY: "Ready",
  IN_PROGRESS: "InProgress",
  COMPLETED: "Completed",
  BYE_COMPLETED: "ByeCompleted",
  FORFEIT: "Forfeit",
  CANCELLED: "Cancelled",
} as const;
