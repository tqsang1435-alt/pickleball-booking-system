import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { requireAuth } from "@/middlewares/auth.middleware";
import * as service from "./play-invitations.service";

export async function createInvitationController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    if (!body.invitationType) {
      return errorResponse("Vui lòng cung cấp loại lời mời (invitationType)", 400);
    }

    const invitation = await service.createPlayInvitation(
      auth.userId,
      body.receiverId ? Number(body.receiverId) : null,
      body.groupId ? Number(body.groupId) : null,
      body.invitationType,
      body.message || "",
      body.challengeDate,
      body.challengeStartTime,
      body.challengeEndTime
    );

    return successResponse(invitation, "Gửi lời mời thành công", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function getReceivedInvitationsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const list = await service.getReceived(auth.userId);
    return successResponse(list, "Lấy danh sách lời mời đã nhận thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getSentInvitationsController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const list = await service.getSent(auth.userId);
    return successResponse(list, "Lấy danh sách lời mời đã gửi thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function acceptInvitationController(req: NextRequest, invitationId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await service.acceptInvitation(invitationId, auth.userId);
    return successResponse(result, "Chấp nhận lời mời thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function rejectInvitationController(req: NextRequest, invitationId: number) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const result = await service.rejectInvitation(invitationId, auth.userId);
    return successResponse(result, "Từ chối lời mời thành công");
  } catch (error) {
    return handleError(error);
  }
}

export async function getPendingInvitationCountController(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const count = await service.getPendingCount(auth.userId);
    return successResponse({ count }, "Lấy số lượng lời mời đang chờ xử lý thành công");
  } catch (error) {
    return handleError(error);
  }
}
