// frontend/src/modules/admin/revenue/hooks/useRevenue.ts

"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { getAdminRevenue } from "@/services/admin-revenue.service";
import type {
  RevenueFilterParams,
  RevenueResponse,
} from "@/types/revenue.types";

export function useRevenue() {
  const [
    data,
    setData,
  ] = useState<RevenueResponse | null>(
    null
  );
  const [
    filters,
    setFilters,
  ] = useState<RevenueFilterParams>(
    {}
  );
  const [
    loading,
    setLoading,
  ] = useState(true);
  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const fetchRevenue =
    useCallback(
      async (
        nextFilters:
          RevenueFilterParams = {}
      ) => {
        try {
          setLoading(true);
          setError(null);

          const result =
            await getAdminRevenue(
              nextFilters
            );

          setData(result);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Lỗi tải doanh thu"
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  const applyFilters =
    useCallback(
      async (
        nextFilters:
          RevenueFilterParams
      ) => {
        setFilters(
          nextFilters
        );
        await fetchRevenue(
          nextFilters
        );
      },
      [fetchRevenue]
    );

  useEffect(() => {
    void fetchRevenue();
  }, [fetchRevenue]);

  return {
    data,
    filters,
    loading,
    error,
    applyFilters,
    refetch: () =>
      fetchRevenue(filters),
  };
}
