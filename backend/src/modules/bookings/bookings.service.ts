import * as bookingRepo from "./bookings.repository";
import type {
  CreateCourtBookingInput,
  CreateCoachBookingInput,
  CreateComboBookingInput,
} from "./bookings.type";

function calculateHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  const diffMinutes = end - start;

  if (diffMinutes <= 0) {
    throw new Error("End time must be greater than start time");
  }

  const hours = diffMinutes / 60;

  if (hours < 1) {
    throw new Error("Minimum booking duration is 1 hour");
  }

  if (hours > 4) {
    throw new Error("Maximum booking duration is 4 hours");
  }

  return hours;
}

function validateBookingDate(bookingDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(bookingDate);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    throw new Error("Booking date must be today or in the future");
  }
}

export async function createCourtBooking(input: CreateCourtBookingInput) {
  validateBookingDate(input.bookingDate);

  const user = await bookingRepo.findUserById(input.userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.Status !== "Active") {
    throw new Error("User account is not active");
  }

  const court = await bookingRepo.findCourtByIdForBooking(input.courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  if (court.Status !== "Available") {
    throw new Error("Court is not available");
  }

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;

  const slot = await bookingRepo.findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );

  if (!slot) {
    throw new Error("Court slot is not available");
  }

  return bookingRepo.createCourtBooking({
    userId: input.userId,
    courtId: input.courtId,
    slotId: slot.SlotID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
  });
}

export async function createCoachBooking(input: CreateCoachBookingInput) {
  validateBookingDate(input.bookingDate);

  const user = await bookingRepo.findUserById(input.userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.Status !== "Active") {
    throw new Error("User account is not active");
  }

  const coach = await bookingRepo.findCoachByIdForBooking(input.coachId);

  if (!coach) {
    throw new Error("Coach not found");
  }

  if (coach.Status !== "Approved") {
    throw new Error("Coach is not approved");
  }

  const hours = calculateHours(input.startTime, input.endTime);
  const coachFee = Number(coach.HourlyRate) * hours;

  const coachSchedule = await bookingRepo.findAvailableCoachSchedule(
    input.coachId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );

  if (!coachSchedule) {
    throw new Error("Coach schedule is not available");
  }

  return bookingRepo.createCoachBooking({
    userId: input.userId,
    coachId: input.coachId,
    coachScheduleId: coachSchedule.CoachScheduleID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    coachFee,
  });
}

export async function createComboBooking(input: CreateComboBookingInput) {
  validateBookingDate(input.bookingDate);

  const user = await bookingRepo.findUserById(input.userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.Status !== "Active") {
    throw new Error("User account is not active");
  }

  const court = await bookingRepo.findCourtByIdForBooking(input.courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  if (court.Status !== "Available") {
    throw new Error("Court is not available");
  }

  const coach = await bookingRepo.findCoachByIdForBooking(input.coachId);

  if (!coach) {
    throw new Error("Coach not found");
  }

  if (coach.Status !== "Approved") {
    throw new Error("Coach is not approved");
  }

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;
  const coachFee = Number(coach.HourlyRate) * hours;

  const slot = await bookingRepo.findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );

  if (!slot) {
    throw new Error("Court slot is not available");
  }

  const coachSchedule = await bookingRepo.findAvailableCoachSchedule(
    input.coachId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );

  if (!coachSchedule) {
    throw new Error("Coach schedule is not available");
  }

  return bookingRepo.createComboBooking({
    userId: input.userId,
    courtId: input.courtId,
    coachId: input.coachId,
    slotId: slot.SlotID,
    coachScheduleId: coachSchedule.CoachScheduleID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
    coachFee,
  });
}

export async function getMyBookings(userId: number) {
  const user = await bookingRepo.findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return bookingRepo.findBookingsByUserId(userId);
}

export async function getBookingDetail(bookingId: number) {
  const booking = await bookingRepo.findBookingById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
}