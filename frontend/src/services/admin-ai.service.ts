import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";

export interface OccupancyForecastData {
  ForecastID: number;
  CourtID: number;
  ForecastDate: string;
  HourStart: number;
  PredictedRate: number;
  ModelVersion: string;
  CreatedAt: string;
}

export interface PromotionRecommendationData {
  RecommendationID: number;
  TargetDate: string;
  TargetHourRange: string;
  SuggestedDiscount: number;
  DiscountType: string;
  Reasoning: string;
  MarketingMessage: string;
  Status: "Suggested" | "Approved" | "Rejected" | "Implemented";
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface AIModelLogData {
  LogID: number;
  RequestType: string;
  LatencyMs: number;
  InputPayload: string;
  OutputPayload: string;
  ActualRate: number | null;
  ForecastError: number | null;
  CreatedAt: string;
}

export interface AccuracyMetricSummary {
  EvaluationDate: string;
  AvgLatency: number;
  TotalSlotsAudited: number;
  AvgActualOccupancy: number;
  MeanAbsoluteError: number;
}

interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getOccupancyForecasts(date: string): Promise<OccupancyForecastData[]> {
  const result = await apiClient<BackendApiResponse<OccupancyForecastData[]>>(
    `/api/admin/ai/forecasts?date=${date}`,
    { token: getToken() }
  );
  return result.data || [];
}

export async function getPromotionRecommendations(date: string): Promise<PromotionRecommendationData[]> {
  const result = await apiClient<BackendApiResponse<PromotionRecommendationData[]>>(
    `/api/admin/ai/recommendations?date=${date}`,
    { token: getToken() }
  );
  return result.data || [];
}

export async function updateRecommendationStatus(
  id: number,
  status: "Suggested" | "Approved" | "Rejected" | "Implemented",
  customDiscount?: number,
  customMarketingMessage?: string
): Promise<{ success: boolean; message: string }> {
  const result = await apiClient<BackendApiResponse<{ success: boolean; message: string }>>(
    `/api/admin/ai/recommendations/${id}/status`,
    {
      method: "POST",
      body: { status, customDiscount, customMarketingMessage },
      token: getToken(),
    }
  );
  return result.data;
}

export async function triggerManualAI(
  date: string,
  thresholdOccupancy: number,
  basePrice: number
): Promise<any> {
  const result = await apiClient<BackendApiResponse<any>>("/api/admin/ai/generate", {
    method: "POST",
    body: { date, thresholdOccupancy, basePrice },
    token: getToken(),
  });
  return result.data;
}

export async function getAIModelLogs(limit: number = 50): Promise<AIModelLogData[]> {
  const result = await apiClient<BackendApiResponse<AIModelLogData[]>>(
    `/api/admin/ai/logs?limit=${limit}`,
    { token: getToken() }
  );
  return result.data || [];
}

export async function getAccuracyMetrics(): Promise<{ summary: AccuracyMetricSummary[] }> {
  const result = await apiClient<BackendApiResponse<{ summary: AccuracyMetricSummary[] }>>(
    "/api/admin/ai/accuracy",
    { token: getToken() }
  );
  return result.data || { summary: [] };
}
