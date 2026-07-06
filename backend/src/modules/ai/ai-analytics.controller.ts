import * as service from "./ai-analytics.service";
import * as repo from "./ai-analytics.repository";

/**
 * Controller methods for AI forecasts and promotions.
 */

export async function getForecasts(date: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Ngày dự báo không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD");
  }
  return repo.getOccupancyForecasts(date);
}

export async function getRecommendations(date: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Ngày lấy đề xuất không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD");
  }
  return repo.getPromotionRecommendations(date);
}

export async function updateRecommendation(
  id: number,
  status: string,
  adminId?: number,
  customDiscount?: number,
  customMarketingMessage?: string
) {
  if (!id || id <= 0) {
    throw new Error("ID đề xuất không hợp lệ");
  }
  const allowedStatuses = ["Suggested", "Approved", "Rejected", "Implemented"];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Trạng thái không hợp lệ. Cho phép: ${allowedStatuses.join(", ")}`);
  }
  
  const success = await repo.updateRecommendationStatus(id, status);
  if (!success) {
    throw new Error("Không tìm thấy đề xuất khuyến mãi với ID đã cung cấp");
  }
  
  let promoCode = "";
  if (status === "Approved") {
    // Retrieve recommendation details
    const rec = await repo.findRecommendationById(id);
    if (rec) {
      if (customDiscount !== undefined && customDiscount !== null) {
        rec.SuggestedDiscount = customDiscount;
      }
      if (customMarketingMessage !== undefined && customMarketingMessage !== null) {
        rec.MarketingMessage = customMarketingMessage;
      }

      // Update details in DB
      await repo.updateRecommendationDetails(id, rec.SuggestedDiscount, rec.MarketingMessage);

      // Auto-register promotion as Inactive (Scheduled)
      promoCode = await repo.createActivePromotionFromRecommendation(rec, adminId);
      
      // Write audit log trail
      await repo.logAIRequest(
        `approve_recommendation_${id}`,
        0,
        JSON.stringify({ adminId, status, timestamp: new Date() }),
        JSON.stringify({ promoCode, recommendation: rec })
      );
    }
  }
  
  return { 
    success: true, 
    message: `Cập nhật trạng thái đề xuất thành: ${status}`,
    promoCode 
  };
}

export async function triggerManualRun(date: string, threshold?: number, basePrice?: number) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Ngày đích không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD");
  }
  
  // 1. Force retraining
  await service.retrainAIModel();
  
  // 2. Generate predictions and promos for target date
  const result = await service.generateForecastsAndPromotions(
    date,
    threshold ?? 50.0,
    basePrice ?? 200000.0
  );
  
  return {
    success: true,
    message: `Đã chạy dự báo và khuyến mãi thủ công thành công cho ngày ${date}`,
    details: result
  };
}

export async function getLogs(limit?: number) {
  const finalLimit = limit && limit > 0 ? limit : 100;
  return repo.getAIModelLogs(finalLimit);
}

export async function getAccuracyMetrics() {
  const summary = await service.getAccuracyMetricsSummary();
  return {
    summary
  };
}
