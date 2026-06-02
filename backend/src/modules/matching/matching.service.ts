// ==========================================
// matching.service.ts
// Business logic for AI Matching (BR-93, BR-94)
// ==========================================

/**
 * Executes the AI Matching algorithm for a specific player.
 * MUST enforce BR-93 and BR-94.
 */
export async function findMatchesForPlayer(playerId: number) {
  // TODO: Check BR-94 (Player must have complete profile)
  // const profile = await playerRepo.getProfile(playerId);
  // if (!isProfileComplete(profile)) {
  //   throw new Error("BR-94: Vui lòng điền đầy đủ hồ sơ chơi trước khi dùng tính năng Matching.");
  // }
  
  // TODO: Implement BR-93 (Matching algorithm based on skill, position, exp, schedule)
  // const candidates = await matchingRepo.findPotentialCandidates(playerId);
  // return calculateMatchingScores(profile, candidates);
  
  throw new Error("TODO: Implemented by future devs");
}
