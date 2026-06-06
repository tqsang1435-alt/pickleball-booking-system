import { NextRequest } from "next/server";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import { getTodayOperations, checkInOperation, completeOperation, noShowOperation } from "./operations.service";

export async function getTodayOperationsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Staff"]);
    if (roleCheck) return roleCheck;

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");

    const result = await getTodayOperations(dateParam);
    return successResponse(result, "Get today operations successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function checkInOperationController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Staff"]);
    if (roleCheck) return roleCheck;

    const body = await req.json().catch(() => ({}));

    const result = await checkInOperation(bookingId, body.note, auth.userId);
    return successResponse(result, "Check-in booking successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function completeOperationController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Staff"]);
    if (roleCheck) return roleCheck;

    const result = await completeOperation(bookingId, auth.userId);
    return successResponse(result, "Complete booking successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function noShowOperationController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Staff"]);
    if (roleCheck) return roleCheck;

    const body = await req.json().catch(() => ({}));

    // Modified to pass userId for logging
    const result = await noShowOperation(bookingId, body.note, auth.userId);
    return successResponse(result, "Mark booking as no-show successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getBookingLogsController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const roleCheck = requireRoles(auth, ["Admin", "Staff"]);
    if (roleCheck) return roleCheck;

    const { repoGetBookingLogs } = await import("./operations.repository");
    const result = await repoGetBookingLogs(bookingId);
    
    return successResponse(result, "Get booking logs successfully");
  } catch (error) {
    return handleError(error);
  }
}
