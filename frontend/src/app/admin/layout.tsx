import { Suspense } from "react";
import AdminLayout from "@/modules/admin/AdminLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}