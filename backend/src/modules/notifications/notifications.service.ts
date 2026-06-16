import * as notifRepo from "./notifications.repository";
import type { CreateNotificationInput } from "./notifications.type";

/**
 * Tao thong bao trong he thong (insert vao bang Notifications).
 * Duoc goi boi cac module khac (bookings, refunds...).
 * Khong throw error de khong anh huong den business logic chinh.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    await notifRepo.insertNotification(input);
  } catch (error) {
    // Log loi nhung khong re-throw, tranh lam hong business flow chinh
    console.error("[Notification] Failed to create notification:", error);
  }
}

export async function getMyNotifications(userId: number, limit: number = 50) {
  return notifRepo.getMyNotifications(userId, limit);
}

export async function countUnreadNotifications(userId: number) {
  return notifRepo.countUnreadNotifications(userId);
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  await notifRepo.markNotificationAsRead(notificationId, userId);
}

export async function markAllNotificationsAsRead(userId: number) {
  await notifRepo.markAllNotificationsAsRead(userId);
}

// ── Email Notification Service ────────────────────────
import { sendNotificationEmail } from "../../utils/mail";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Gửi email thông báo tin nhắn mới trong nhóm
 */
export async function notifyGroupChatMessage(senderId: number, groupId: number, content: string) {
  try {
    const groupInfo = await notifRepo.getGroupInfoForEmail(groupId);
    if (!groupInfo) return;

    const members = await notifRepo.getActiveGroupMembersForEmail(groupId);
    const sender = members.find(m => m.UserID === senderId);
    const senderName = sender ? sender.FullName : "Một thành viên";

    for (const member of members) {
      if (member.UserID === senderId) continue; // Không gửi cho người gửi

      let emailLogId: number | null = null;
      try {
        emailLogId = await notifRepo.createEmailLog({
          userId: member.UserID,
          email: member.Email,
          notificationType: "GROUP_CHAT_MESSAGE",
          groupId: groupId,
          status: "Reserved",
          cooldownMinutes: 5
        });

        // Nếu null tức là đã bị chặn bởi Atomic check cooldown trong DB
        if (!emailLogId) continue;

        // Tạo chuông thông báo trong hệ thống
        await createNotification({
          userId: member.UserID,
          title: "Tin nhắn mới",
          message: `Bạn có tin nhắn mới trong nhóm ${groupInfo.GroupName}`,
          notificationType: "Matching"
        });

        await sendNotificationEmail({
          to: member.Email,
          fullName: member.FullName,
          type: "GROUP_CHAT_MESSAGE",
          subject: `Tin nhắn mới từ nhóm ${groupInfo.GroupName}`,
          title: "Tin nhắn mới",
          message: `Bạn có tin nhắn mới trong nhóm ${groupInfo.GroupName}.\n\nNgười gửi: ${senderName}\n\nVui lòng đăng nhập PickleClub để xem và trả lời tin nhắn.`,
          actionUrl: `${FRONTEND_URL}/matching`,
          actionText: "Xem tin nhắn",
        });

        // Cập nhật log thành công
        if (emailLogId) {
          await notifRepo.updateEmailLogStatus(emailLogId, "Sent");
        }
      } catch (err: any) {
        // Cập nhật log lỗi
        if (emailLogId) {
          await notifRepo.updateEmailLogStatus(emailLogId, "Failed", err.message || "Unknown error");
        }
      }
    }
  } catch (error) {
    console.error("[Notification] notifyGroupChatMessage error:", error);
  }
}

/**
 * Gửi email khi có lời mời (Team, Group, Challenge)
 */
export async function notifyPlayInvitationCreated(invitation: any) {
  try {
    let toUserId: number | null = null;
    let type = "";
    let subject = "";
    let title = "";
    let message = "";

    const senderInfo = await notifRepo.getUserEmailInfo(invitation.SenderID);
    const senderName = senderInfo ? senderInfo.FullName : "Một người chơi";

    if (invitation.InvitationType === "InviteToPlay" || invitation.InvitationType === "InviteToGroup") {
      toUserId = invitation.ReceiverID;
      type = invitation.InvitationType === "InviteToPlay" ? "TEAM_INVITATION" : "GROUP_INVITATION";
      subject = type === "TEAM_INVITATION" ? "Bạn có lời mời ghép đội mới" : `Bạn được mời tham gia nhóm`;
      title = type === "TEAM_INVITATION" ? "Lời mời ghép đội" : "Lời mời tham gia nhóm";
      message = `${senderName} vừa gửi cho bạn một ${title.toLowerCase()}.${invitation.Message ? `\n\nLời nhắn: "${invitation.Message}"` : ""}`;
    } else if (invitation.InvitationType === "InviteOpponent") {
      // Đối với InviteOpponent, gửi cho Receiver (thường là leader nhóm đối thủ)
      toUserId = invitation.ReceiverID;
      type = "CHALLENGE_INVITATION";
      subject = `Nhóm của ${senderName} đã gửi lời thách đấu`;
      title = "Lời mời thách đấu";
      message = `Nhóm của ${senderName} vừa gửi lời thách đấu cho nhóm của bạn.${invitation.Message ? `\n\nLời nhắn: "${invitation.Message}"` : ""}`;
    }

    if (!toUserId) return;

    const receiverInfo = await notifRepo.getUserEmailInfo(toUserId);
    if (!receiverInfo || receiverInfo.UserID === invitation.SenderID) return;

    try {
      await sendNotificationEmail({
        to: receiverInfo.Email,
        fullName: receiverInfo.FullName,
        type: type,
        subject: subject,
        title: title,
        message: message,
        actionUrl: `${FRONTEND_URL}/matching`,
        actionText: "Xem lời mời",
      });

      await notifRepo.createEmailLog({
        userId: receiverInfo.UserID,
        email: receiverInfo.Email,
        notificationType: type,
        refType: "PlayInvitation",
        refId: invitation.InvitationID,
        status: "Sent"
      });
    } catch (err: any) {
      await notifRepo.createEmailLog({
        userId: receiverInfo.UserID,
        email: receiverInfo.Email,
        notificationType: type,
        refType: "PlayInvitation",
        refId: invitation.InvitationID,
        status: "Failed",
        errorMessage: err.message || "Unknown error"
      });
    }
  } catch (error) {
    console.error("[Notification] notifyPlayInvitationCreated error:", error);
  }
}

/**
 * Gửi email khi lời mời được chấp nhận/từ chối
 */
export async function notifyInvitationStatusChanged(invitation: any, status: 'Accepted' | 'Rejected') {
  try {
    // Gửi cho người tạo lời mời (SenderID)
    const receiverInfo = await notifRepo.getUserEmailInfo(invitation.SenderID);
    if (!receiverInfo) return;

    const responderInfo = await notifRepo.getUserEmailInfo(invitation.ReceiverID);
    const responderName = responderInfo ? responderInfo.FullName : "Người nhận";

    const type = status === 'Accepted' ? "INVITATION_ACCEPTED" : "INVITATION_REJECTED";
    const subject = status === 'Accepted' ? "Lời mời của bạn đã được chấp nhận" : "Lời mời của bạn đã bị từ chối";
    const title = status === 'Accepted' ? "Chấp nhận lời mời" : "Từ chối lời mời";
    const message = `${responderName} đã ${status === 'Accepted' ? 'chấp nhận' : 'từ chối'} lời mời của bạn.`;

    try {
      await sendNotificationEmail({
        to: receiverInfo.Email,
        fullName: receiverInfo.FullName,
        type: type,
        subject: subject,
        title: title,
        message: message,
        actionUrl: `${FRONTEND_URL}/matching`,
        actionText: "Xem thông tin",
      });

      await notifRepo.createEmailLog({
        userId: receiverInfo.UserID,
        email: receiverInfo.Email,
        notificationType: type,
        refType: "PlayInvitation",
        refId: invitation.InvitationID,
        status: "Sent"
      });
    } catch (err: any) {
      await notifRepo.createEmailLog({
        userId: receiverInfo.UserID,
        email: receiverInfo.Email,
        notificationType: type,
        refType: "PlayInvitation",
        refId: invitation.InvitationID,
        status: "Failed",
        errorMessage: err.message || "Unknown error"
      });
    }
  } catch (error) {
    console.error("[Notification] notifyInvitationStatusChanged error:", error);
  }
}
