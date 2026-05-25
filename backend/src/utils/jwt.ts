import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import type { JwtPayload } from "@/modules/auth/auth.type";

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "24h",
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}