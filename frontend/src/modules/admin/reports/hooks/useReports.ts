"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  exportAdminReport,
  getAdminReportHistory,
} from "@/services/admin-reports.service";

import {
  getDashboardStats,
  getDemoSaaSDashboardStats,
  type SaaSDashboardStats,
} from "@/services/adminApi";

import {
  getToken,
} from "@/utils/authStorage";

import type {
  ReportFilterValue,
  ReportHistoryItem,
} from "../types";

function getDefaultRevenueRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  const toYmd = (date: Date) =>
    date.toLocaleDateString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

  return {
    startDate: toYmd(start),
    endDate: toYmd(end),
  };
}

export function useReports() {
  const [
    history,
    setHistory,
  ] = useState<
    ReportHistoryItem[]
  >([]);

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const [
    isLoadingHistory,
    setIsLoadingHistory,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    revenueStats,
    setRevenueStats,
  ] = useState<
    SaaSDashboardStats | null
  >(null);

  const [
    isLoadingRevenueStats,
    setIsLoadingRevenueStats,
  ] = useState(false);

  const [
    revenueRange,
  ] = useState(
    getDefaultRevenueRange
  );

  const loadRevenueStats =
    useCallback(
      async () => {
        try {
          setIsLoadingRevenueStats(
            true
          );

          const token =
            getToken();

          if (!token) {
            setRevenueStats(
              getDemoSaaSDashboardStats()
            );
            return;
          }

          const result =
            await getDashboardStats(
              token,
              revenueRange.startDate,
              revenueRange.endDate
            );

          if (
            "dailyRevenueTrend" in result
          ) {
            setRevenueStats(
              result
            );
          } else {
            setRevenueStats(
              getDemoSaaSDashboardStats()
            );
          }
        } catch {
          setRevenueStats(
            getDemoSaaSDashboardStats()
          );
        } finally {
          setIsLoadingRevenueStats(
            false
          );
        }
      },
      [
        revenueRange.endDate,
        revenueRange.startDate,
      ]
    );

  const loadHistory =
    useCallback(
      async () => {
        try {
          setIsLoadingHistory(
            true
          );

          setError(null);

          const result =
            await getAdminReportHistory(
              50
            );

          setHistory(
            result
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Không thể tải lịch sử xuất báo cáo"
          );
        } finally {
          setIsLoadingHistory(
            false
          );
        }
      },
      []
    );

  const exportReport =
    useCallback(
      async (
        input:
          ReportFilterValue
      ): Promise<void> => {
        try {
          setIsExporting(
            true
          );

          setError(null);

          const result = await exportAdminReport(
            input
          );

          if (result && typeof window !== "undefined") {
            const objectUrl = window.URL.createObjectURL(result.blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = result.filename;
            anchor.style.display = "none";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => {
              window.URL.revokeObjectURL(objectUrl);
            }, 0);
          }

          await loadHistory();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Xuất báo cáo thất bại"
          );
        } finally {
          setIsExporting(
            false
          );
        }
      },
      [loadHistory]
    );

  useEffect(() => {
    void loadHistory();
    void loadRevenueStats();
  }, [loadHistory, loadRevenueStats]);

  return {
    history,
    error,
    revenueStats,
    revenueRange,
    isExporting,
    isLoadingHistory,
    isLoadingRevenueStats,
    exportReport,
    loadHistory,
    loadRevenueStats,
  };
}
