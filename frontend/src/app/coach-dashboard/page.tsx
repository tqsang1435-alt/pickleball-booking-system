"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/utils/authStorage";
import CoachDashboard from "@/modules/coaches/CoachDashboard";
import StateBox from "@/components/common/StateBox";

export default function Page() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const userToken = getToken();
    const user = getUser();
    const roles = user?.roles || (user?.role ? [user.role] : [user?.RoleName || ""]);
    const isCoach = roles.some((r: string) =>
      r.toLowerCase().includes("coach")
    );

    if (!userToken || !isCoach) {
      router.push("/login");
      return;
    }

    setToken(userToken);
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="container">
        <StateBox variant="loading" title="Đang kiểm tra quyền truy cập" />
      </main>
    );
  }

  if (!token) return null;

  return (
    <main>
      <CoachDashboard token={token} />
    </main>
  );
}
