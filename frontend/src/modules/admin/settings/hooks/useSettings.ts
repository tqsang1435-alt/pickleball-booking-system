"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { ApiResponse } from "@/types/api";
import type { GroupedSettings } from "../types";

type SeedStatus = { seeded: boolean; count: number; total: number };

export function useSettings() {
  const [grouped, setGrouped]       = useState<GroupedSettings>({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [seedStatus, setSeedStatus] = useState<SeedStatus | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient<ApiResponse<GroupedSettings>>("/api/admin/settings", {
        token: getToken(),
      });
      setGrouped(res.data ?? {});
    } catch (e: any) {
      setError(e.message ?? "Không thể tải cấu hình");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeedStatus = useCallback(async () => {
    try {
      const res = await apiClient<ApiResponse<SeedStatus>>("/api/admin/settings/seed", {
        token: getToken(),
      });
      setSeedStatus(res.data);
    } catch {
      // bỏ qua
    }
  }, []);

  const runSeed = useCallback(async (reset = false) => {
    setSeedLoading(true);
    setSeedMessage("");
    try {
      const res = await apiClient<ApiResponse<unknown>>("/api/admin/settings/seed", {
        method: "POST",
        token: getToken(),
        body: { reset },
      });
      setSeedMessage((res as any).message ?? "Seed thành công");
      await fetch();
      await fetchSeedStatus();
    } catch (e: any) {
      setSeedMessage("Lỗi: " + (e.message ?? "Không thể seed"));
    } finally {
      setSeedLoading(false);
    }
  }, [fetch, fetchSeedStatus]);

  // Lưu một nhóm cùng lúc (batch)
  const saveGroup = useCallback(async (entries: { key: string; value: unknown }[]) => {
    setSaveStatus("saving");
    try {
      await apiClient("/api/admin/settings/batch", {
        method: "PATCH",
        token: getToken(),
        body: { settings: entries },
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      await fetch();
    } catch (e: any) {
      setSaveStatus("error");
      throw e;
    }
  }, [fetch]);

  return {
    grouped, loading, error, saveStatus, fetch, saveGroup,
    seedStatus, seedLoading, seedMessage, fetchSeedStatus, runSeed,
  };
}
