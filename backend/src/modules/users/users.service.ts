import type { UpdateProfileDto } from "./users.dto";
import {
  findAllUsers,
  findUserById,
  updateProfile,
  updateUserStatus,
} from "./users.repository";

export async function getUsers() {
  return findAllUsers();
}

export async function getStaffUsers() {
  const { findStaffUsers } = await import("./users.repository");
  return findStaffUsers();
}

export async function getUserDetail(userId: number) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  return user;
}

export async function getMyProfile(userId: number) {
  return getUserDetail(userId);
}

export async function editMyProfile(userId: number, data: UpdateProfileDto) {
  await updateProfile(userId, data);

  return getUserDetail(userId);
}

export async function lockUser(userId: number) {
  await updateUserStatus(userId, "Locked");

  return {
    userId,
    status: "Locked",
  };
}

export async function unlockUser(userId: number) {
  await updateUserStatus(userId, "Active");

  return {
    userId,
    status: "Active",
  };
}

export async function deactivateUser(userId: number) {
  await updateUserStatus(userId, "Inactive");

  return {
    userId,
    status: "Inactive",
  };
}

export async function createStaffByAdmin(data: import("./users.dto").CreateStaffAdminDto) {
  // Validate input
  if (!data.fullName || !data.email) {
    const { AppError } = await import("@/utils/AppError");
    throw new AppError("Họ tên và email là bắt buộc", 400);
  }

  const bcrypt = await import("bcryptjs");
  const password = data.password || "123456"; // Default password
  const cost = 12; // bcrypt cost >= 12
  const passwordHash = await bcrypt.hash(password, cost);

  const userId = await import("./users.repository").then((m) =>
    m.createStaffAdminTransaction({ ...data, passwordHash })
  );

  return userId;
}