import * as courtRepo from "./courts.repository";
import type { CreateCourtSlotInput } from "./courts.type";

function validateTime(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (end <= start) {
    throw new Error("End time must be greater than start time");
  }
}

export async function getAllCourts() {
  return courtRepo.findAllCourts();
}

export async function getCourtById(courtId: number) {
  const court = await courtRepo.findCourtById(courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  return court;
}

export async function getAvailableCourts(
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

  validateTime(startTime, endTime);

  return courtRepo.findAvailableCourts(bookingDate, startTime, endTime);
}

export async function getCourtSlots(courtId: number, slotDate: string) {
  if (!courtId) {
    throw new Error("courtId is required");
  }

  if (!slotDate) {
    throw new Error("slotDate is required");
  }

  const court = await courtRepo.findCourtById(courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  return courtRepo.findCourtSlots(courtId, slotDate);
}

export async function createCourtSlot(input: CreateCourtSlotInput) {
  const court = await courtRepo.findCourtById(input.courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  if (court.Status !== "Available") {
    throw new Error("Court is not available");
  }

  validateTime(input.startTime, input.endTime);

  return courtRepo.createCourtSlot({
    courtId: input.courtId,
    slotDate: input.slotDate,
    startTime: input.startTime,
    endTime: input.endTime,
    price: input.price,
  });
}