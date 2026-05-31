// ==========================================
// playgroups.service.ts
// Business logic for PlayGroups
// ==========================================
import * as playgroupsRepo from "./playgroups.repository";

/**
 * Create a new play group.
 * MUST enforce BR-92: Player can only join a max of 3 active groups.
 */
export async function createGroup(input: any) {
  // TODO: Check BR-92 before creating
  // const activeCount = await playgroupsRepo.countActiveGroupsByPlayer(input.creatorId);
  // if (activeCount >= 3) throw new Error("BR-92: Player is already in 3 active groups");
  
  throw new Error("TODO: Implemented by future devs");
}

/**
 * Invite a player to a group.
 * MUST enforce BR-91: Max 4 members per group.
 */
export async function invitePlayer(input: any) {
  // TODO: Check BR-91 before inviting
  // const members = await playgroupsRepo.countGroupMembers(input.groupId);
  // if (members >= 4) throw new Error("BR-91: Group is full (max 4 members)");
  
  throw new Error("TODO: Implemented by future devs");
}

/**
 * Run via Cron Job to expire invitations.
 * MUST enforce BR-90: Invitations expire after 48 hours.
 */
export async function cleanupExpiredInvitations() {
  // TODO: Query DB for invitations where CreatedAt < (NOW - 48h) and Status = 'Pending'
  // Update Status to 'Expired'
  
  throw new Error("TODO: Implemented by future devs");
}
