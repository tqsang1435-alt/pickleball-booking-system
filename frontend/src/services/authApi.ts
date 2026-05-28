import { apiClient } from "@/services/apiClient";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

type MessageResponse = {
  success: boolean;
  message: string;
  data?: {
    message?: string;
    email?: string;
  };
};

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerApi(
  payload: RegisterPayload
): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function verifyRegisterOtpApi(data: {
  email: string;
  otp: string;
}): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/api/auth/verify-register-otp", {
    method: "POST",
    body: data,
  });
}

export async function forgotPasswordApi(data: {
  email: string;
}): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: data,
  });
}

export async function resetPasswordApi(data: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<MessageResponse> {
  return apiClient<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: data,
  });
}

export async function googleLoginApi(data: {
  credential: string;
}): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/google-login", {
    method: "POST",
    body: data,
  });
}