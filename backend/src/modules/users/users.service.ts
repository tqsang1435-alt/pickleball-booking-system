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