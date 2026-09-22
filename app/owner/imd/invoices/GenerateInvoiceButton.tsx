"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function GenerateInvoiceButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  async function generate() {
    const res = await fetch("/api/v1/imd/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/owner/imd/invoices/${data.id}`);
      router.refresh();
    }
  }

  return (
    <Button size="sm" variant="secondary" onClick={generate}>
      Generate invoice
    </Button>
  );
}
