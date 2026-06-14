import { NextRequest } from "next/server";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import * as staffService from "./staff.service";

export async function getStaffDashboardStatsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const roleCheck = requireRoles(auth, ["Staff", "Admin", "Manager"]);
    if (roleCheck) return roleCheck;
    const result = await staffService.getDashboardStats();
    return successResponse(result, "Lấy thống kê dashboard thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function markBookingNoShowController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const roleCheck = requireRoles(auth, ["Staff", "Admin", "Manager"]);
    if (roleCheck) return roleCheck;
    const result = await staffService.markNoShow(bookingId, auth.userId);
    return successResponse(result, "Đã ghi nhận khách vắng mặt");
  } catch (error) {
    return handleError(error);
  }
}

export async function markBookingCompletedController(req: NextRequest, bookingId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const roleCheck = requireRoles(auth, ["Staff", "Admin", "Manager"]);
    if (roleCheck) return roleCheck;
    const result = await staffService.markCompleted(bookingId, auth.userId);
    return successResponse(result, "Đã xác nhận hoàn thành lượt chơi");
  } catch (error) {
    return handleError(error);
  }
}

export async function getCourtStatusBoardController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const roleCheck = requireRoles(auth, ["Staff", "Admin", "Manager"]);
    if (roleCheck) return roleCheck;
    const result = await staffService.getCourtStatusBoard();
    return successResponse(result, "Lấy tình trạng sân thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function createIncidentReportController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const roleCheck = requireRoles(auth, ["Staff", "Admin", "Manager"]);
    if (roleCheck) return roleCheck;
    const body = await req.json();
    if (!body.courtId || !body.incidentType || !body.description || !body.urgency) {
      return successResponse(null, "Thiếu thông tin bắt buộc");
    }
    const result = await staffService.createIncidentReport({
      staffId: auth.userId,
      courtId: Number(body.courtId),
      incidentType: body.incidentType,
      description: body.description,
      urgency: body.urgency,
    });
    return successResponse(result, "Đã gửi báo cáo sự cố", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function getMyIncidentsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const roleCheck = requireRoles(auth, ["Staff", "Admin", "Manager"]);
    if (roleCheck) return roleCheck;
    const result = await staffService.getMyIncidents(auth.userId);
    return successResponse(result, "Lấy danh sách sự cố thành công");
  } catch (error) {
    return handleError(error);
  }
}
