import * as repo from "./playgroups.repository";
import { findProfileByUserId } from "../player-matching/player-matching.repository";

export async function createPlayGroup(data: repo.GroupData, creatorId: number) {
  // 1. Verify creator has a profile
  const profile = await findProfileByUserId(creatorId);
  if (!profile) {
    throw new Error("Bạn cần cập nhật Hồ sơ chơi bóng trước khi tạo nhóm.");
  }

  // 2. Enforce max 3 active groups limit
  const activeCount = await repo.countActiveGroupsForCreator(creatorId);
  if (activeCount >= 3) {
    throw new Error("Bạn chỉ được tạo và làm trưởng nhóm tối đa 3 nhóm hoạt động đồng thời.");
  }

  const groupId = await repo.createGroup(data, creatorId);
  return repo.getGroupDetails(groupId);
}

export async function getPlayGroups(filters: { skillLevel?: string; keyword?: string }) {
  return repo.listGroups(filters);
}

export async function getPlayGroupDetails(groupId: number) {
  const group = await repo.getGroupDetails(groupId);
  if (!group) {
    throw new Error("Không tìm thấy nhóm chơi.");
  }
  return group;
}

export async function joinPlayGroup(groupId: number, userId: number) {
  // 1. Verify user has a profile
  const profile = await findProfileByUserId(userId);
  if (!profile) {
    throw new Error("Bạn cần cập nhật Hồ sơ chơi bóng trước khi tham gia nhóm.");
  }

  // 2. Verify group status
  const group = await repo.getGroupDetails(groupId);
  if (!group) {
    throw new Error("Không tìm thấy nhóm chơi.");
  }

  if (group.Status === 'Closed') {
    throw new Error("Nhóm này đã đóng.");
  }

  if (group.Status === 'Full' || group.CurrentPlayers >= group.MaxPlayers) {
    throw new Error("Nhóm đã đầy thành viên.");
  }

  // 3. Verify duplicate join
  const isMember = await repo.checkUserInGroup(groupId, userId);
  if (isMember) {
    throw new Error("Bạn đã tham gia nhóm này rồi.");
  }

  await repo.addGroupMember(groupId, userId);
  return repo.getGroupDetails(groupId);
}

export async function leavePlayGroup(groupId: number, userId: number) {
  const group = await repo.getGroupDetails(groupId);
  if (!group) {
    throw new Error("Không tìm thấy nhóm chơi.");
  }

  const isMember = await repo.checkUserInGroup(groupId, userId);
  if (!isMember) {
    throw new Error("Bạn không phải thành viên của nhóm này.");
  }

  // Handle Leader leaving rules
  if (group.CreatorID === userId) {
    const activeMembersCount = group.members.filter((m: any) => m.RoleInGroup !== 'Leader' && m.MemberStatus === 'Active').length;
    if (activeMembersCount > 0) {
      throw new Error("Trưởng nhóm không thể tự ý rời nhóm khi vẫn còn thành viên khác. Vui lòng đóng nhóm trước.");
    } else {
      // Creator is the only one in the group: close the group
      await repo.updateGroupStatus(groupId, 'Closed');
      await repo.removeGroupMember(groupId, userId);
      return { status: "Closed", message: "Nhóm đã được đóng và trưởng nhóm đã rời nhóm." };
    }
  }

  await repo.removeGroupMember(groupId, userId);
  return repo.getGroupDetails(groupId);
}

export async function closePlayGroup(groupId: number, userId: number) {
  const group = await repo.getGroupDetails(groupId);
  if (!group) {
    throw new Error("Không tìm thấy nhóm chơi.");
  }

  if (group.CreatorID !== userId) {
    throw new Error("Chỉ trưởng nhóm mới có quyền đóng nhóm.");
  }

  await repo.updateGroupStatus(groupId, 'Closed');
  return repo.getGroupDetails(groupId);
}

export async function updatePlayGroup(
  groupId: number,
  userId: number,
  data: {
    groupName: string;
    skillLevel: string;
    averageExperience: number;
    description: string;
    status: string;
  }
) {
  const group = await repo.getGroupDetails(groupId);
  if (!group) {
    throw new Error("Nhóm chơi không tồn tại.");
  }

  if (group.CreatorID !== userId) {
    throw new Error("Bạn không có quyền chỉnh sửa nhóm này.");
  }

  if (!data.groupName || !data.groupName.trim()) {
    throw new Error("Tên nhóm không được để trống.");
  }

  const validSkillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
  if (!validSkillLevels.includes(data.skillLevel)) {
    throw new Error("Trình độ nhóm không hợp lệ.");
  }

  if (data.averageExperience === undefined || data.averageExperience === null || isNaN(Number(data.averageExperience)) || Number(data.averageExperience) < 0) {
    throw new Error("Kinh nghiệm trung bình phải lớn hơn hoặc bằng 0.");
  }

  const validStatuses = ['Open', 'Active', 'Full', 'Closed'];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new Error("Trạng thái nhóm không hợp lệ.");
  }

  await repo.updateGroup(groupId, {
    groupName: data.groupName.trim(),
    skillLevel: data.skillLevel,
    averageExperience: Number(data.averageExperience),
    description: data.description || "",
    status: data.status || "Open",
  });

  return repo.getGroupDetails(groupId);
}
