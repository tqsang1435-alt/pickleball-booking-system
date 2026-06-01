import { Suspense } from "react";
import TeamBookingStubPage from "@/modules/bookings/TeamBookingStubPage";

export const metadata = {
  title: "Đặt sân nhóm | Pickleball Booking",
  description: "Đặt sân sau khi ghép nhóm chơi thành công.",
};

export default function TeamBookingPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
          Đang tải...
        </div>
      }
    >
      <TeamBookingStubPage />
    </Suspense>
  );
}
