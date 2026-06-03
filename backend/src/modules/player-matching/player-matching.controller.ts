import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import * as service from "./player-matching.service";

export async function getPlayerProfileController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const profile = await service.getPlayerProfile(auth.userId);
    return successResponse(profile, "Lấy hồ sơ matching thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function savePlayerProfileController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();

    const playingRole = body.PlayingRole ?? body.playingRole;
    const skillLevel = body.SkillLevel ?? body.skillLevel;
    const experienceYearsRaw = body.ExperienceYears ?? body.experienceYears;
    const playStyle = body.PlayStyle ?? body.playStyle;
    const goal = body.Goal ?? body.goal;
    const matchingStatus = body.MatchingStatus ?? body.matchingStatus;
    const availableStartTime = body.AvailableStartTime ?? body.availableStartTime;
    const availableEndTime = body.AvailableEndTime ?? body.availableEndTime;

    // Simple inline validation
    if (!playingRole || !skillLevel) {
      return errorResponse("Vui lòng nhập đầy đủ PlayingRole và SkillLevel", 400);
    }

    if (!availableStartTime || typeof availableStartTime !== 'string' || !availableStartTime.trim()) {
      return errorResponse("Vui lòng nhập giờ bắt đầu rảnh.", 400);
    }
    if (!availableEndTime || typeof availableEndTime !== 'string' || !availableEndTime.trim()) {
      return errorResponse("Vui lòng nhập giờ kết thúc rảnh.", 400);
    }

    const cleanStartTime = availableStartTime.trim().substring(0, 5);
    const cleanEndTime = availableEndTime.trim().substring(0, 5);

    const timeReg = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeReg.test(cleanStartTime)) {
      return errorResponse("Giờ bắt đầu rảnh không đúng định dạng HH:mm.", 400);
    }
    if (!timeReg.test(cleanEndTime)) {
      return errorResponse("Giờ kết thúc rảnh không đúng định dạng HH:mm.", 400);
    }

    if (cleanStartTime >= cleanEndTime) {
      return errorResponse("Giờ kết thúc phải lớn hơn giờ bắt đầu.", 400);
    }

    const exp = parseInt(experienceYearsRaw, 10);
    if (isNaN(exp) || exp < 0) {
      return errorResponse("ExperienceYears phải lớn hơn hoặc bằng 0", 400);
    }

    const data = {
      playingRole,
      experienceYears: exp,
      skillLevel,
      playStyle: playStyle || "",
      goal: goal || "",
      matchingStatus: matchingStatus || "Available",
      availableStartTime: cleanStartTime,
      availableEndTime: cleanEndTime,
    };

    const profile = await service.savePlayerProfile(auth.userId, data);
    return successResponse(profile, "Lưu hồ sơ matching thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getSuitableTeammatesController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const teammates = await service.findSuitableTeammates(auth.userId);
    return successResponse(teammates, "Tìm đồng đội phù hợp thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getUserActiveGroupsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const groups = await service.getUserActiveGroups(auth.userId);
    return successResponse(groups, "Lấy danh sách nhóm của bạn thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getSuitableOpponentsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(req.url);
    const groupIdStr = searchParams.get("groupId");
    if (!groupIdStr) {
      return errorResponse("Vui lòng chọn nhóm chơi của bạn (groupId)", 400);
    }
    const groupId = parseInt(groupIdStr, 10);
    if (isNaN(groupId)) {
      return errorResponse("groupId không hợp lệ", 400);
    }

    const opponents = await service.findSuitableOpponents(auth.userId, groupId);
    return successResponse(opponents, "Tìm đối thủ phù hợp thành công");
  } catch (error) {
    return handleError(error);
  }
}
