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
  adSpace: { name: string };
  payment?: { status: string } | null;
};

export default function AdvertiserBookingRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    fetch("/api/v1/advertiser/booking-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.data || []));
  }, []);

  async function pay(id: string) {
    const res = await fetch("/api/v1/advertiser/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingRequestId: id, method: "upi" }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "confirmed", payment: { status: "completed" } } : r
        )
      );
    }
  }

  return (
    <div>
      <PageHeader title="Booking requests" description="Track and pay for approved bookings" />
      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div>
              <p className="font-semibold text-slate-900">{req.adSpace.name}</p>
              <p className="text-sm text-slate-500">
                {formatDate(req.startDate)} → {formatDate(req.endDate)}
              </p>
              <p className="mt-1 font-medium text-[#1e3a5f]">
                {formatCurrency(req.customerPrice)}
              </p>
              <Badge variant={req.status === "confirmed" ? "success" : "default"}>
                {req.status.replace("_", " ")}
              </Badge>
            </div>
            {req.status === "payment_pending" && (
              <Button size="sm" onClick={() => pay(req.id)}>
                Pay now (UPI)
              </Button>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-slate-500">No booking requests yet.</p>
        )}
      </div>
    </div>
  );
}
