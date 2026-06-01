import BookingHistoryPage from "@/modules/bookings/BookingHistoryPage";

export const metadata = {
  title: "Lịch sử Booking | Pickleball Booking",
  description: "Xem và quản lý toàn bộ lịch sử đặt sân, đặt HLV và combo của bạn.",
};

export default function BookingsPage() {
  return <BookingHistoryPage />;
}
