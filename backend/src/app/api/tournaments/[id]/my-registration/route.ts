import { NextRequest } from "next/server";
import { requireAuth } from "@/middlewares/auth.middleware";
import { successResponse, errorResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import * as tournamentService from "@/modules/tournaments/tournaments.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const resolvedParams = await params;
    const tournamentId = parseInt(resolvedParams.id, 10);
    if (isNaN(tournamentId)) {
      return errorResponse("ID giải đấu không hợp lệ", 400);
    }

    const registration = await tournamentService.getMyRegistrationForTournament(tournamentId, auth.userId);
    return successResponse(registration, "Lấy thông tin đăng ký giải đấu thành công");
  } catch (error) {
    return handleError(error);
  }
}
