import { NextRequest } from "next/server";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRoles } from "@/middlewares/role.middleware";
import { errorResponse } from "@/utils/response";
import type { JwtPayload } from "@/modules/auth/auth.type";

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitMap = new Map<string, RateLimitInfo>();

/**
 * Validates request authentication, checks roles, and enforces rate limits.
 * Returns the JwtPayload on success, or a Response on error.
 */
export function applySecurity(
  req: NextRequest,
  allowedRoles: string[] = ["Admin", "Manager"],
  limit: number = 60,
  windowMs: number = 60000
): JwtPayload | Response {
  // 1. Authenticate with JWT
  const auth = requireAuth(req);
  if (auth instanceof Response) {
    return auth;
  }

  // 2. Authorize via Roles (RBAC)
  const roleCheck = requireRoles(auth, allowedRoles);
  if (roleCheck) {
    return roleCheck;
  }

  // 3. Apply Rate Limiting
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const userKey = `ai_limit:${ip}:${auth.userId}`;
  const now = Date.now();

  const limitInfo = rateLimitMap.get(userKey);
  if (!limitInfo || now > limitInfo.resetTime) {
    // Initialize or reset limit window
    rateLimitMap.set(userKey, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    // Increment request count within current window
    limitInfo.count++;
    if (limitInfo.count > limit) {
      return errorResponse("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.", 429);
    }
  }

  return auth;
}
