import { NextRequest } from "next/server";
import * as coachService from "./coaches.service";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";

export async function getAllCoachesController() {
  try {
    const result = await coachService.getAllCoaches();

    return successResponse(result, "Get coaches successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getCoachByIdController(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const coachId = Number(id);

    if (!coachId) {
      throw new Error("coachId is required");
    }

    const result = await coachService.getCoachById(coachId);

    return successResponse(result, "Get coach detail successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function getCoachSchedulesController(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const coachId = Number(searchParams.get("coachId"));

    if (!coachId) {
      throw new Error("coachId is required");
    }

    const result = await coachService.getCoachSchedules(coachId);

    return successResponse(result, "Get coach schedules successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function createCoachScheduleController(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await coachService.createCoachSchedule({
      coachId: Number(body.coachId),
      workingDate: body.workingDate,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return successResponse(result, "Create coach schedule successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function getAvailableCoachSchedulesController(
  req: NextRequest
) {
  try {
    const { searchParams } = new URL(req.url);

    const bookingDate = searchParams.get("bookingDate") || "";
    const startTime = searchParams.get("startTime") || "";
    const endTime = searchParams.get("endTime") || "";

    const result = await coachService.getAvailableCoachSchedules(
      bookingDate,
      startTime,
      endTime
    );

    return successResponse(
      result,
      "Get available coach schedules successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}