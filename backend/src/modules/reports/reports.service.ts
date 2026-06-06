import * as reportRepo from "./reports.repository";

export async function getDashboardStats() {
  const stats = await reportRepo.getDashboardStatsFromDB();
  
  return stats;
}
