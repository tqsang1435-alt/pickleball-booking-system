import { Suspense } from "react";
import StaffOperationsClient from "./StaffOperationsClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StaffOperationsClient />
    </Suspense>
  );
}
