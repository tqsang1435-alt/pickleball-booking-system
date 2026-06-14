"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { DailyBookingItem, BookingFilters, BookingDetailView } from "@/types/staff.types";
import {
  getDailyBookings,
  checkInBooking,
  markBookingNoShow,
  markBookingCompleted,
  getBookingDetails,
} from "@/services/staff-operations.service";

function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function useOperations() {
  const [bookings, setBookings] = useState<DailyBookingItem[]>([]);
  const [filters, setFilters] = useState<BookingFilters>({
    date: todayStr(),
    status: "All",
    searchText: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<BookingDetailView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadBookings = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await getDailyBookings(filters.date);
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters.date]
  );

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => loadBookings(true), 30_000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filters.status !== "All" && b.status !== filters.status) return false;
      if (filters.searchText) {
        const s = filters.searchText.toLowerCase();
        return (
          b.bookingCode.toLowerCase().includes(s) ||
          b.customerName.toLowerCase().includes(s) ||
          (b.customerPhone ?? "").includes(s) ||
          (b.courtName ?? "").toLowerCase().includes(s) ||
          (b.guestName ?? "").toLowerCase().includes(s) ||
          (b.guestPhone ?? "").includes(s)
        );
      }
      return true;
    });
  }, [bookings, filters.status, filters.searchText]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const handleCheckIn = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await checkInBooking(bookingId);
      showSuccess("Check-in thành công!");
      await loadBookings(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Check-in thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkNoShow = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await markBookingNoShow(bookingId);
      showSuccess("Đã ghi nhận vắng mặt.");
      await loadBookings(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await markBookingCompleted(bookingId);
      showSuccess("Đã xác nhận hoàn thành.");
      await loadBookings(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const openDetails = async (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setDetailLoading(true);
    try {
      const detail = await getBookingDetails(bookingId);
      setDetailView(detail);
    } catch {
      setDetailView(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedBookingId(null);
    setDetailView(null);
  };

  return {
    bookings: filteredBookings,
    totalCount: bookings.length,
    filters,
    setFilters,
    loading,
    error,
    refreshing,
    actionLoading,
    successMsg,
    errorMsg,
    selectedBookingId,
    detailView,
    detailLoading,
    handleCheckIn,
    handleMarkNoShow,
    handleMarkCompleted,
    openDetails,
    closeDetails,
    refresh: () => loadBookings(true),
  };
}
