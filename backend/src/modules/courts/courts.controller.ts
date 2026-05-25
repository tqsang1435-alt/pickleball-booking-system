import { NextRequest } from "next/server";
import * as courtService from "./courts.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

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
    const body = await req.json();

    const result = await courtService.createCourtSlot({
      courtId: Number(body.courtId),
      slotDate: body.slotDate,
      startTime: body.startTime,
      endTime: body.endTime,
      price: Number(body.price),
    });

    return successResponse(result, "Create court slot successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}