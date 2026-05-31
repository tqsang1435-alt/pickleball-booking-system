// ==========================================
// playgroups.repository.ts
// Database operations for PlayGroups
// ==========================================
import type { PlayGroup, GroupInvitation } from "./playgroups.type";

export async function createPlayGroup(data: any): Promise<PlayGroup> {
  throw new Error("TODO: Implemented by future devs");
}

export async function createInvitation(data: any): Promise<GroupInvitation> {
  throw new Error("TODO: Implemented by future devs");
}

/**
 * Counts how many active groups a player is currently in.
 * Used for enforcing BR-92.
 */
export async function countActiveGroupsByPlayer(playerId: number): Promise<number> {
  throw new Error("TODO: Implemented by future devs");
}

/**
 * Counts how many members are currently in a group.
 * Used for enforcing BR-91.
 */
export async function countGroupMembers(groupId: number): Promise<number> {
  throw new Error("TODO: Implemented by future devs");
}
