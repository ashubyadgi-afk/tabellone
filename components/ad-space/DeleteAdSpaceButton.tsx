"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteAdSpaceButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  async function confirmDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/imd/ad-spaces/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message || "Could not delete this ad space.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not delete this ad space.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-ad-space-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-left shadow-xl"
          >
            <p id="delete-ad-space-title" className="text-base font-semibold text-slate-900">
              Do you want to delete this ad space?
            </p>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={loading}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Yes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
