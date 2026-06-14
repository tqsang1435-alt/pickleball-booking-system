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

import type {
  ReportFilterValue,
  ReportHistoryItem,
} from "../types";

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
  }, [loadHistory]);

  return {
    history,
    error,
    isExporting,
    isLoadingHistory,
    exportReport,
    loadHistory,
  };
}