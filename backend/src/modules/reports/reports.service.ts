import * as reportRepo from "./reports.repository";

export async function getDashboardStats() {
  const stats = await reportRepo.getDashboardStatsFromDB();
  
  // Combos and Promotions are mocked for now as per plan
  return {
    ...stats,
    activeCombos: 4,
    activePromotions: 3,
  };
}
