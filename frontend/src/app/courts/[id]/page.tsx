import CourtDetailPage from "@/modules/courts/CourtDetailPage";

export const metadata = {
  title: "Chi tiết sân | Pickleball Booking",
  description: "Xem chi tiết và đặt sân Pickleball.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CourtDetailPage courtId={resolvedParams.id} />;
}
