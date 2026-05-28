import { NextRequest } from "next/server";
import * as bookingService from "./bookings.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";

/**
 * Tạo booking sân
 * UserID lấy từ JWT, không lấy từ body để tránh user giả mạo userId.
 */
export async function createCourtBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    if (auth instanceof Response) {
      return auth;
    }

    const body = await req.json();

    const result = await bookingService.createCourtBooking({
      userId: auth.userId,
      courtId: Number(body.courtId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Create court booking successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Tạo booking Coach
 * UserID lấy từ JWT.
 */
export async function createCoachBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    if (auth instanceof Response) {
      return auth;
    }

    const body = await req.json();

    const result = await bookingService.createCoachBooking({
      userId: auth.userId,
      coachId: Number(body.coachId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Create coach booking successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Tạo combo booking: sân + Coach
 * UserID lấy từ JWT.
 */
export async function createComboBookingController(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    if (auth instanceof Response) {
      return auth;
    }

    const body = await req.json();

    const result = await bookingService.createComboBooking({
      userId: auth.userId,
      courtId: Number(body.courtId),
      coachId: Number(body.coachId),
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Create combo booking successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lấy lịch sử booking của user đang đăng nhập.
 * Không truyền userId qua query nữa.
 */
export async function getMyBookingsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    if (auth instanceof Response) {
      return auth;
    }

    const result = await bookingService.getMyBookings(auth.userId);

    return successResponse(result, "Get bookings successfully");
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Lấy chi tiết booking.
 * Vẫn nhận bookingId qua query.
 * Nên check quyền trong service/repository:
 * booking này có thuộc user đang login không.
 */
export async function getBookingDetailController(req: NextRequest) {
  try {
    const auth = requireAuth(req);

    if (auth instanceof Response) {
      return auth;
    }

    const { searchParams } = new URL(req.url);
    const bookingId = Number(searchParams.get("bookingId"));

    if (!bookingId) {
      throw new Error("bookingId is required");
    }

    const result = await bookingService.getBookingDetail(bookingId);

    return successResponse(result, "Get booking detail successfully");
  } catch (error) {
    return handleError(error);
  }
}