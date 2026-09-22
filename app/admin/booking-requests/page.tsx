"use client";

import { useEffect, useState } from "react";
import { PageHeader, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

type Request = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  customerPrice: number;
  organization: { name: string };
  adSpace: { name: string };
  campaignNotes: string | null;
};

export default function AdminBookingRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/booking-requests")
      .then((r) => r.json())
      .then((d) => {
        setRequests(d.data || []);
        setLoading(false);
      });
  }, []);

  async function review(id: string, action: "approve" | "reject") {
    await fetch("/api/v1/admin/booking-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Booking requests"
        description="Review advertiser campaign booking requests"
      />
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-500">No pending booking requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{req.adSpace.name}</p>
                  <p className="text-sm text-slate-500">{req.organization.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(req.startDate)} → {formatDate(req.endDate)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#1e3a5f]">
                    {formatCurrency(req.customerPrice)}
                  </p>
                  {req.campaignNotes && (
                    <p className="mt-2 text-sm text-slate-500">{req.campaignNotes}</p>
                  )}
                  <div className="mt-2">
                    <Badge variant="warning">{req.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review(req.id, "approve")}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => review(req.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
