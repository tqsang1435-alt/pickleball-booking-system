"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/utils/authStorage";
import AdminStaffPage from "@/modules/admin/staff/AdminStaffPage";
import StateBox from "@/components/common/StateBox";

export default function Page() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const userToken = getToken();
    const user = getUser();
    const role = String(
      user?.RoleName || user?.role || user?.roles?.[0] || ""
    ).toLowerCase();

    if (!userToken || !role.includes("admin")) {
      router.push("/login");
      return;
    }

    setToken(userToken);
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <StateBox variant="loading" title="Đang kiểm tra quyền truy cập" />
    );
  }

  if (!token) return null;

  return <AdminStaffPage token={token} />;
}
