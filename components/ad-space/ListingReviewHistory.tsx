import { formatDateTime } from "@/lib/utils";
import { listingReviewActionLabel } from "@/lib/listing-review";

export type ListingReviewEventView = {
  id: string;
  action: string;
  reason: string | null;
  createdAt: string;
  actor: { email: string; role: string } | null;
};

export function ListingReviewHistory({
  events,
}: {
  events: ListingReviewEventView[];
}) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No review history yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="border-l-2 border-slate-200 pl-4">
          <p className="text-sm font-semibold text-slate-900">
            {listingReviewActionLabel(event.action)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDateTime(event.createdAt)}
            {event.actor?.email ? ` · ${event.actor.email}` : ""}
          </p>
          {event.reason ? (
            <p className="mt-1 text-sm text-slate-700">{event.reason}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
