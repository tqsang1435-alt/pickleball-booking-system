"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/services/apiClient";
import { getToken } from "@/utils/authStorage";
import type { ApiResponse } from "@/types/api";
import { UserRow } from "../UserManagement";

type Params = {
    search: string;
    page: number;
    isLocked?: string;
    roleName?: string;
};

type UsersResponse = {
    items: UserRow[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export function useUserManagement({ search, page, isLocked, roleName }: Params) {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchUsers = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setIsLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                ...(search ? { search } : {}),
                ...(isLocked ? { isLocked } : {}),
                ...(roleName ? { roleName } : {}),
            });

            const res = await apiClient<ApiResponse<UsersResponse>>(
                `/api/admin/users?${params}`,
                { token }
            );

            setUsers(res.data?.items ?? []);
            setTotal(res.data?.pagination?.total ?? 0);
            setTotalPages(res.data?.pagination?.totalPages ?? 1);
        } catch (err: any) {
            setError(err.message ?? "Không thể tải danh sách user");
        } finally {
            setIsLoading(false);
        }
    }, [search, page, isLocked, roleName]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    return { users, total, totalPages, isLoading, error, refetch: fetchUsers };
}