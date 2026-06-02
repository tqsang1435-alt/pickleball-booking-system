// ==========================================
// playgroups.type.ts
// Definition of PlayGroup and related types
// ==========================================

export interface PlayGroup {
  GroupId: number;
  CreatorId: number;
  GroupName: string;
  MaxMembers: number; // BR-91: Max 4 members
  Status: "Active" | "Closed" | "Cancelled";
  CreatedAt: string;
}

export interface GroupInvitation {
  InvitationId: number;
  GroupId: number;
  InviterId: number;
  InviteeId: number;
  Status: "Pending" | "Accepted" | "Rejected" | "Expired";
  CreatedAt: string; // BR-90: Expire after 48h
}
