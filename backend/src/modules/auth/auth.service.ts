import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as authRepo from "./auth.repository";
import type { LoginInput, RegisterInput } from "./auth.type";
import { generateOtp, hashOtp, compareOtp } from "@/utils/otp";
import { sendOtpEmail } from "@/utils/mail";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

function createToken(payload: {
  userId: number;
  email: string;
  roles: string[];
}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h",
  });
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

  const user = await authRepo.createPlayerAccount(input, passwordHash);

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await authRepo.createEmailOtp({
    userId: user.UserID,
    email: user.Email,
    otpHash,
    purpose: "REGISTER",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOtpEmail(user.Email, otp);

  return {
    message: "Đăng ký thành công. Vui lòng kiểm tra Gmail để nhập mã OTP.",
    email: user.Email,
  };
}

export async function verifyRegisterOtp(input: {
  email: string;
  otp: string;
}) {
  const otpRecord = await authRepo.findLatestValidOtp(
    input.email,
    "REGISTER"
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

  await authRepo.activateUserByEmail(input.email);
  await authRepo.markOtpUsed(otpRecord.OtpID);

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

if (user.Status === "Pending") {
  throw new Error("Tài khoản chưa xác thực email");
}

if (user.Status !== "Active") {
  throw new Error("Account is not active");
}
  if (user.LockedUntil && new Date(user.LockedUntil) > new Date()) {
    throw new Error("Account is temporarily locked");
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.PasswordHash
  );

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
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
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