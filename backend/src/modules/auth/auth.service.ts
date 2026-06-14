import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import * as authRepo from "./auth.repository";
import type { LoginInput, RegisterInput, JwtPayload } from "./auth.type";
import { generateOtp, hashOtp, compareOtp } from "@/utils/otp";
import { sendOtpEmail } from "@/utils/mail";
import { signAccessToken } from "@/utils/jwt";

function createToken(payload: JwtPayload) {
  return signAccessToken(payload);
}

export async function register(input: RegisterInput) {
  const existedEmail = await authRepo.findUserByEmail(input.email);

  if (existedEmail) {
    throw new Error("Email already exists");
  }

  const existedPhone = await authRepo.findUserByPhoneNumber(input.phoneNumber);

  if (existedPhone) {
    throw new Error("Phone number already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await authRepo.deletePendingRegisterByEmail(input.email);

  await authRepo.createPendingRegister({
    fullName: input.fullName,
    email: input.email,
    phoneNumber: input.phoneNumber,
    passwordHash,
    gender: input.gender ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    address: input.address ?? null,
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOtpEmail(input.email, otp);

  return {
    message:
      "OTP đã được gửi đến Gmail. Vui lòng xác thực để hoàn tất đăng ký.",
    email: input.email,
  };
}

export async function verifyRegisterOtp(input: { email: string; otp: string }) {
  const pending = await authRepo.findLatestPendingRegister(input.email);

  if (!pending) {
    throw new Error("OTP không hợp lệ hoặc đã hết hạn");
  }

  if (pending.Attempts >= 5) {
    throw new Error("Bạn đã nhập sai OTP quá nhiều lần");
  }

  const isMatch = await compareOtp(input.otp, pending.OtpHash);

  if (!isMatch) {
    await authRepo.increasePendingRegisterAttempts(pending.PendingID);
    throw new Error("OTP không đúng");
  }

  await authRepo.createPlayerAccount(
    {
      fullName: pending.FullName,
      email: pending.Email,
      phoneNumber: pending.PhoneNumber,
      password: "",
      gender: pending.Gender,
      dateOfBirth: pending.DateOfBirth,
      address: pending.Address,
    },
    pending.PasswordHash
  );

  await authRepo.deletePendingRegisterByEmail(input.email);

  return {
    message: "Xác thực email thành công. Bạn có thể đăng nhập.",
  };
}

export async function login(input: LoginInput) {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.Status === "Locked") {
    throw new Error("Account is locked");
  }

  if (user.Status !== "Active") {
    throw new Error("Account is not active");
  }

  if (user.LockedUntil && new Date(user.LockedUntil) > new Date()) {
    throw new Error("Account is temporarily locked");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.PasswordHash);

  if (!isPasswordValid) {
    await authRepo.increaseFailedLogin(input.email);
    throw new Error("Invalid email or password");
  }

  await authRepo.resetFailedLogin(user.UserID);

  const roles = await authRepo.findRolesByUserId(user.UserID);

  const token = createToken({
    userId: user.UserID,
    email: user.Email,
    roles,
  });

  return {
    token,
    user: {
      userId: user.UserID,
      fullName: user.FullName,
      email: user.Email,
      phoneNumber: user.PhoneNumber,
      avatarUrl: user.AvatarURL,
      gender: user.Gender,
      dateOfBirth: user.DateOfBirth,
      address: user.Address,
      status: user.Status,
      roles,
    },
  };
}

export async function me(userId: number) {
  const user = await authRepo.findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const roles = await authRepo.findRolesByUserId(user.UserID);

  return {
    userId: user.UserID,
    fullName: user.FullName,
    email: user.Email,
    phoneNumber: user.PhoneNumber,
    avatarUrl: user.AvatarURL,
    gender: user.Gender,
    dateOfBirth: user.DateOfBirth,
    address: user.Address,
    status: user.Status,
    roles,
  };
}

export async function forgotPassword(input: { email: string }) {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) {
    throw new Error("Email không tồn tại");
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await authRepo.createEmailOtp({
    userId: user.UserID,
    email: user.Email,
    otpHash,
    purpose: "RESET_PASSWORD",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOtpEmail(user.Email, otp);

  return {
    message: "OTP đặt lại mật khẩu đã được gửi đến Gmail.",
    email: user.Email,
  };
}

export async function resetPassword(input: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  const otpRecord = await authRepo.findLatestValidOtp(
    input.email,
    "RESET_PASSWORD"
  );

  if (!otpRecord) {
    throw new Error("OTP không hợp lệ hoặc đã hết hạn");
  }

  if (otpRecord.Attempts >= 5) {
    throw new Error("Bạn đã nhập sai OTP quá nhiều lần");
  }

  const isMatch = await compareOtp(input.otp, otpRecord.OtpHash);

  if (!isMatch) {
    await authRepo.increaseOtpAttempts(otpRecord.OtpID);
    throw new Error("OTP không đúng");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);

  await authRepo.updatePasswordByEmail(input.email, passwordHash);
  await authRepo.markOtpUsed(otpRecord.OtpID);

  return {
    message: "Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.",
  };
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(input: { credential: string }) {
  if (!input.credential) {
    throw new Error("Thiếu Google credential");
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Chưa cấu hình GOOGLE_CLIENT_ID");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: input.credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new Error("Không lấy được email từ Google");
  }

  if (!payload.email_verified) {
    throw new Error("Email Google chưa được xác thực");
  }

  let user = await authRepo.findUserByEmail(payload.email);

  if (!user) {
    user = await authRepo.createGooglePlayerAccount({
      fullName: payload.name || payload.email.split("@")[0],
      email: payload.email,
      avatarUrl: payload.picture || null,
    });
  }

  if (user.Status === "Locked") {
    throw new Error("Tài khoản đã bị khóa");
  }

  if (user.Status !== "Active") {
    throw new Error("Tài khoản chưa hoạt động");
  }

  const roles = await authRepo.findRolesByUserId(user.UserID);

  const token = createToken({
    userId: user.UserID,
    email: user.Email,
    roles,
  });

  return {
    token,
    user: {
      userId: user.UserID,
      fullName: user.FullName,
      email: user.Email,
      phoneNumber: user.PhoneNumber,
      avatarUrl: user.AvatarURL,
      gender: user.Gender,
      dateOfBirth: user.DateOfBirth,
      address: user.Address,
      status: user.Status,
      roles,
    },
  };
}