import { Suspense } from "react";
import StaffOperationsClient from "./StaffOperationsClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <StaffOperationsClient />
    </Suspense>
  );
}