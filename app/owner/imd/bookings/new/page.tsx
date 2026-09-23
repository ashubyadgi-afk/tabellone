import { NewBookingForm } from "./NewBookingForm";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const { startDate, endDate } = await searchParams;
  return <NewBookingForm startDate={startDate} endDate={endDate} />;
}
