import { NextRequest } from "next/server";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import { createCourtBooking, createWalkInCourtBooking, createCoachBooking, createComboBooking, cancelBooking, cancelBookingByCoach, checkInBooking, mockPayBooking, releaseExpiredBookings, completeCheckedInBookings, getMyBookings, getCoachReceivedBookings, getBookingDetail, getDailyBookings, createTeamBooking } from "./bookings.service";


// ---- Create Bookings ----

/**
 * UC-13: Tao booking san.
 * UserID lay tu JWT, khong lay tu body (BR-22/BR-NEW-02).
 */
export async function createCourtBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await createCourtBooking({
      userId: auth.userId,
      courtId: Number(body.courtId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat san thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function createStaffWalkInBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Manager", "Staff"]);
    if (roleCheck) return roleCheck;

    const body = await req.json();
    const paymentMethod =
      body.paymentMethod === "BankTransfer" ? "BankTransfer" : "Cash";

    const result = await createWalkInCourtBooking({
      staffId: auth.userId,
      staffRoles: auth.roles,
      courtId: Number(body.courtId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
      customerId: body.customerId ? Number(body.customerId) : undefined,
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      paymentMethod,
    });

    return successResponse(result, "Tao booking tai quay thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Tao booking Coach.
 */
export async function createCoachBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await createCoachBooking({
      userId: auth.userId,
      coachId: Number(body.coachId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat HLV thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * UC-15: Tao combo booking (san + HLV).
 */
export async function createComboBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await createComboBooking({
      userId: auth.userId,
      courtId: Number(body.courtId),
      coachId: Number(body.coachId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat combo san + HLV thanh cong", 201);
  } catch (error) {
    return handleError(error);
  }
}

// ---- Cancel Booking (UC-17) ----

/**
 * UC-17: Huy booking.
 * bookingId lay tu URL params (/api/bookings/:bookingId/cancel).
 */
export async function cancelBookingController(
  req: NextRequest,
  bookingId: number
) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));

    const result = await cancelBooking({
      bookingId,
      userId: auth.userId,
      userRoles: auth.roles,
      cancelReason: body.cancelReason,
    });

    return successResponse(result, "Huy booking thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * BR-54: Coach chu dong huy booking Confirmed.
 */
export async function cancelBookingByCoachController(
  req: NextRequest,
  bookingId: number
) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    // Chi Coach moi duoc goi endpoint nay
    const roleCheck = requireRoles(auth, ["Coach", "Admin"]);
    if (roleCheck) return roleCheck;

    const result = await cancelBookingByCoach(bookingId, auth.userId);

    return successResponse(result, "HLV da huy booking. Player se duoc hoan tien trong 24 gio.");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Check-in (BR-29/30) ----

/**
 * BR-29/30: Check-in booking.
 */
export async function checkInController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await checkInBooking({
      bookingId,
      userId: auth.userId,
      userRoles: auth.roles, // Pass roles for bypass ownership
    });

    return successResponse(result, "Check-in thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Mock Pay ----

/**
 * Mock payment: PendingPayment → Confirmed.
 * Dev sau thay bang VNPay/Momo webhook.
 */
export async function mockPayController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));
    const paymentMethod = body.paymentMethod === "Momo" ? "Momo" : "VNPay";

    const result = await mockPayBooking(bookingId, auth.userId, paymentMethod);

    return successResponse(result, "Thanh toan thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Release Expired (BR-26/31) ----

/**
 * BR-26/31: Giai phong booking het han va mark no-show.
 * BR-32: Tu dong chuyen CheckedIn -> Completed sau khi het gio choi.
 * Goi boi cron job hoac thu cong.
 */
export async function releaseExpiredController(_req: NextRequest) {
  try {
    const [releaseResult, completeResult] = await Promise.all([
      releaseExpiredBookings(),
      completeCheckedInBookings(),
    ]);

    return successResponse(
      { ...releaseResult, ...completeResult },
      `Kiem tra hoan tat: ${releaseResult.releasedHoldings} hold het han, ${releaseResult.autoCheckedIn} auto check-in, ${completeResult.completedCount} hoan thanh`
    );
  } catch (error) {
    return handleError(error);
  }
}

// ---- View Bookings ----

/**
 * UC-19: Lay lich su booking cua user dang dang nhap.
 */
export async function getMyBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await getMyBookings(auth.userId);
    return successResponse(result, "Lay lich su booking thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lay danh sach booking ma HLV nhan duoc.
 */
export async function getCoachReceivedBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Coach", "Admin"]);
    if (roleCheck) return roleCheck;

    const result = await getCoachReceivedBookings(auth.userId);
    return successResponse(result, "Lay danh sach don dat lich thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lay chi tiet booking (kiem tra quyen).
 */
export async function getBookingDetailController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(req.url);
    const bookingId = Number(searchParams.get("bookingId"));

    if (!bookingId) throw new Error("bookingId la bat buoc");

    const result = await getBookingDetail(bookingId, auth.userId, auth.roles);
    return successResponse(result, "Lay chi tiet booking thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * UC-49: Staff xem booking trong ngay.
 * BR-NEW-04: Chi Staff/Admin moi duoc xem.
 */
export async function getDailyBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Staff"]);
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;

    const result = await getDailyBookings(date);
    return successResponse(result, "Lay booking trong ngay thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

// ---- Team Booking (UC-36) ----

/**
 * UC-36: Dat san cho nhom da duoc ghep (matched players).
 */
export async function createTeamBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    if (!body.groupId) {
      throw new Error("groupId la bat buoc cho Team Booking (UC-36)");
    }

    const result = await createTeamBooking({
      userId: auth.userId,
      groupId: Number(body.groupId),
      courtId: Number(body.courtId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Dat san cho nhom thanh cong (UC-36)", 201);
  } catch (error) {
    return handleError(error);
  }
}
