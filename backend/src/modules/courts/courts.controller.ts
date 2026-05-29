import { NextRequest } from "next/server";
import * as courtService from "./courts.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";

export async function getAllCourtsController() {
  try {
    const result = await courtService.getAllCourts();

    return successResponse(result, "Get courts successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getCourtByIdController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const courtId = Number(id);

    if (!courtId) {
      throw new Error("courtId is required");
    }

    const result = await courtService.getCourtById(courtId);

    return successResponse(result, "Get court detail successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getAvailableCourtsController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const bookingDate = searchParams.get("bookingDate") || "";
    const startTime = searchParams.get("startTime") || "";
    const endTime = searchParams.get("endTime") || "";

    const result = await courtService.getAvailableCourts(
      bookingDate,
      startTime,
      endTime
    );

    return successResponse(result, "Get available courts successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getCourtSlotsController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const courtId = Number(searchParams.get("courtId"));
    const slotDate = searchParams.get("slotDate") || "";

    if (!courtId) {
      throw new Error("courtId is required");
    }

    if (!slotDate) {
      throw new Error("slotDate is required");
    }

    const result = await courtService.getCourtSlots(courtId, slotDate);

    return successResponse(result, "Get court slots successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function createCourtSlotController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin", "Staff"]);
    if (forbidden) return forbidden;

    const body = await req.json();

    const result = await courtService.createCourtSlot({
      courtId: Number(body.courtId),
      slotDate: body.slotDate,
      startTime: body.startTime,
      endTime: body.endTime,
      price: Number(body.price),
    });

    return successResponse(result, "Tạo slot thành công", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCourtSlotStatusController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin", "Staff"]);
    if (forbidden) return forbidden;

    const { id } = await context.params;
    const slotId = Number(id);

    if (!slotId) {
      throw new Error("slotId is required");
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      throw new Error("status is required");
    }

    const result = await courtService.updateCourtSlotStatus(slotId, status);

    return successResponse(result, "Cập nhật trạng thái slot thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCourtSlotController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin", "Staff"]);
    if (forbidden) return forbidden;

    const { id } = await context.params;
    const slotId = Number(id);

    if (!slotId) {
      throw new Error("slotId is required");
    }

    const result = await courtService.deleteCourtSlot(slotId);

    return successResponse(result, "Xóa slot thành công");
  } catch (error) {
    return handleError(error);
  }
}



export async function createCourtController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const body = await req.json();
    const mappedData = {
      courtCode: body.courtCode || body.CourtCode,
      courtName: body.courtName || body.CourtName,
      courtType: body.courtType || body.CourtType,
      location: body.location || body.Location,
      description: body.description || body.Description,
      pricePerHour: body.pricePerHour !== undefined ? body.pricePerHour : body.PricePerHour,
      courtImage: body.courtImage || body.CourtImage,
      status: body.status || body.Status,
      openTime: body.openTime || body.OpenTime,
      closeTime: body.closeTime || body.CloseTime,
    };

    const result = await courtService.createCourt(mappedData);

    return successResponse(result, "Tạo sân mới thành công", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCourtController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const { id } = await context.params;
    const courtId = Number(id);

    if (!courtId) {
      throw new Error("courtId is required");
    }

    const body = await req.json();
    const mappedData = {
      courtCode: body.courtCode || body.CourtCode,
      courtName: body.courtName || body.CourtName,
      courtType: body.courtType || body.CourtType,
      location: body.location || body.Location,
      description: body.description || body.Description,
      pricePerHour: body.pricePerHour !== undefined ? body.pricePerHour : body.PricePerHour,
      courtImage: body.courtImage || body.CourtImage,
      status: body.status || body.Status,
      openTime: body.openTime || body.OpenTime,
      closeTime: body.closeTime || body.CloseTime,
    };

    const result = await courtService.updateCourt(courtId, mappedData);

    return successResponse(result, "Cập nhật sân thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCourtController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin"]);
    if (forbidden) return forbidden;

    const { id } = await context.params;
    const courtId = Number(id);

    if (!courtId) {
      throw new Error("courtId is required");
    }

    const result = await courtService.deleteCourt(courtId);

    return successResponse(result, "Xóa sân thành công");
  } catch (error) {
    return handleError(error);
  }
}

// ─── UC-62: Sinh slot hàng loạt ──────────────────────────────

export async function generateCourtSlotsController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const forbidden = requireRoles(user, ["Admin", "Staff"]);
    if (forbidden) return forbidden;

    const body = await req.json();
    const { courtId, slotDate, durationMinutes, price } = body;

    if (!courtId || !slotDate || !durationMinutes || price === undefined) {
      throw new Error(
        "Thiếu thông tin bắt buộc: courtId, slotDate, durationMinutes, price"
      );
    }

    const result = await courtService.generateCourtSlots({
      courtId: Number(courtId),
      slotDate: String(slotDate),
      durationMinutes: Number(durationMinutes),
      price: Number(price),
    });

    return successResponse(
      result,
      `Đã tạo ${result.created} slot mới (bỏ qua ${result.skipped} slot đã tồn tại)`,
      201
    );
  } catch (error) {
    return handleError(error);
  }
}