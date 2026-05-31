import { NextRequest } from "next/server";
import * as bookingService from "./bookings.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";

// ==========================================
// CREATE BOOKINGS
// ==========================================

/**
 * UC-13: Tao booking san.
 * UserID lay tu JWT, khong lay tu body (BR-22/BR-NEW-02).
 */
export async function createCourtBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await bookingService.createCourtBooking({
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

/**
 * Tao booking Coach.
 */
export async function createCoachBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const result = await bookingService.createCoachBooking({
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

    const result = await bookingService.createComboBooking({
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

// ==========================================
// CANCEL BOOKING (UC-17)
// ==========================================

/**
 * UC-17: Huy booking.
 * bookingId lay tu URL params (/api/bookings/:bookingId/cancel).
 * UserID va roles lay tu JWT.
 */
export async function cancelBookingController(
  req: NextRequest,
  bookingId: number
) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));

    const result = await bookingService.cancelBooking({
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

    const result = await bookingService.cancelBookingByCoach(
      bookingId,
      auth.userId
    );

    return successResponse(result, "HLV da huy booking. Player se duoc hoan tien trong 24 gio.");
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================
// CHECK-IN (BR-29/30)
// ==========================================

/**
 * BR-29/30: Check-in booking.
 */
export async function checkInController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await bookingService.checkInBooking({
      bookingId,
      userId: auth.userId,
      userRoles: auth.roles, // Pass roles for bypass ownership
    });

    return successResponse(result, "Check-in thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================
// MOCK PAY
// ==========================================

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

    const result = await bookingService.mockPayBooking(
      bookingId,
      auth.userId,
      paymentMethod
    );

    return successResponse(result, "Thanh toan thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================
// RELEASE EXPIRED (BR-26/31)
// ==========================================

/**
 * BR-26/31: Giai phong booking het han va mark no-show.
 * BR-32: Tu dong chuyen CheckedIn -> Completed sau khi het gio choi.
 * Goi boi cron job hoac thu cong.
 */
export async function releaseExpiredController(_req: NextRequest) {
  try {
    const [releaseResult, completeResult] = await Promise.all([
      bookingService.releaseExpiredBookings(),
      bookingService.completeCheckedInBookings(),
    ]);

    return successResponse(
      { ...releaseResult, ...completeResult },
      `Kiem tra hoan tat: ${releaseResult.releasedHoldings} hold het han, ${releaseResult.markedNoShow} no-show, ${completeResult.completedCount} hoan thanh`
    );
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================
// VIEW BOOKINGS
// ==========================================

/**
 * UC-19: Lay lich su booking cua user dang dang nhap.
 */
export async function getMyBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await bookingService.getMyBookings(auth.userId);
    return successResponse(result, "Lay lich su booking thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lay danh sach booking ma HLV nhan duoc
 */
export async function getCoachReceivedBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Coach", "Admin"]);
    if (roleCheck) return roleCheck;

    const result = await bookingService.getCoachReceivedBookings(auth.userId);
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

    const result = await bookingService.getBookingDetail(
      bookingId,
      auth.userId,
      auth.roles
    );
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

    const result = await bookingService.getDailyBookings(date);
    return successResponse(result, "Lay booking trong ngay thanh cong");
  } catch (error) {
    return handleError(error);
  }
}

// ==========================================
// UC-36: TEAM BOOKING
// ==========================================

/**
 * UC-36: Dat san cho nhom da duoc ghep (matched players).
 * Sau khi PlayerMatching match thanh cong, leader cua nhom goi endpoint nay.
 *
 * TODO: Sau khi PlayGroups module implement, bo comment phan validate group status.
 */
export async function createTeamBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    if (!body.groupId) {
      throw new Error("groupId la bat buoc cho Team Booking (UC-36)");
    }

    const result = await bookingService.createTeamBooking({
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