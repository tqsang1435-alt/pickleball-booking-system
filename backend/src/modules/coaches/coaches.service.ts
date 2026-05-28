import * as coachRepo from "./coaches.repository";
import type { CreateCoachScheduleInput } from "./coaches.type";

function validateTime(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (end <= start) {
    throw new Error("End time must be greater than start time");
  }
}

export async function getAllCoaches() {
  return coachRepo.findAllApprovedCoaches();
}

export async function getCoachById(coachId: number) {
  const coach = await coachRepo.findCoachById(coachId);

  if (!coach) {
    throw new Error("Coach not found");
  }

  return coach;
}

export async function getCoachSchedules(coachId: number) {
  const coach = await coachRepo.findCoachById(coachId);

  if (!coach) {
    throw new Error("Coach not found");
  }

  return coachRepo.findCoachSchedules(coachId);
}

export async function createCoachSchedule(input: CreateCoachScheduleInput) {
  const coach = await coachRepo.findCoachById(input.coachId);

  if (!coach) {
    throw new Error("Coach not found");
  }

  if (coach.Status !== "Approved") {
    throw new Error("Coach is not approved");
  }

  validateTime(input.startTime, input.endTime);

  return coachRepo.createCoachSchedule({
    coachId: input.coachId,
    workingDate: input.workingDate,
    startTime: input.startTime,
    endTime: input.endTime,
  });
}
export async function getAvailableCoachSchedules(
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  if (!bookingDate) {
    throw new Error("bookingDate is required");
  }

  if (!startTime || !endTime) {
    throw new Error("startTime and endTime are required");
  }

  return coachRepo.findAvailableCoachSchedules(
    bookingDate,
    startTime,
    endTime
  );
}