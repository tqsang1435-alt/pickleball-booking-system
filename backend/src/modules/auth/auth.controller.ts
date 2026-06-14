import { NextRequest } from "next/server";

import * as authService from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validation";
import { successResponse } from "@/utils/response";
import { handleError } from "@/middlewares/error";
import { verifyAccessToken } from "@/utils/jwt";

export async function registerController(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const result = await authService.register(data);

    return successResponse(result, "Register successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function verifyRegisterOtpController(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await authService.verifyRegisterOtp({
      email: body.email,
      otp: body.otp,
    });

    return successResponse(result, "Verify register OTP successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function loginController(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const result = await authService.login(data);

    return successResponse(result, "Login successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function meController(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    const result = await authService.me(decoded.userId);

    return successResponse(result, "Get current user successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function forgotPasswordController(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await authService.forgotPassword({
      email: body.email,
    });

    return successResponse(result, "Send reset password OTP successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function resetPasswordController(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await authService.resetPassword({
      email: body.email,
      otp: body.otp,
      newPassword: body.newPassword,
    });

    return successResponse(result, "Reset password successfully");
  } catch (error) {
    return handleError(error);
  }
}


export async function googleLoginController(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await authService.googleLogin({
      credential: body.credential,
    });

    return successResponse(
      result,
      "Đăng nhập Google thành công"
    );
  } catch (error) {
    return handleError(error);
  }
}