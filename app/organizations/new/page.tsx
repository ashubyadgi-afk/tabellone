"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/lib/validation/organization";

export default function AddOrganizationPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { type: "owner" },
  });

  async function onSubmit(data: CreateOrganizationInput) {
    setServerError(null);

    const response = await fetch("/api/v1/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await response.json();

    if (!response.ok) {
      const message =
        json?.error?.message ??
        json?.error?.details?.[0]?.message ??
        "Failed to register organization";
      setServerError(message);
      return;
    }

    router.push(
      `/organizations/success?id=${encodeURIComponent(json.id)}&name=${encodeURIComponent(json.name)}`
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-tabellone-primary">
            Tabellone
          </Link>
          <span className="text-sm text-slate-500">Add Company</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-tabellone-primary">
            Register your organization
          </h1>
          <p className="mt-2 text-slate-600">
            Create your company profile on Tabellone. This is the first step for
            AdSpace Owners and Advertisers.
          </p>

          {serverError && (
            <div
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <Field label="Organization name" error={errors.name?.message} required>
              <input
                {...register("name")}
                className="field-input"
                placeholder="e.g. Mumbai Billboards Pvt Ltd"
              />
            </Field>

            <Field label="Brand name" error={errors.brandName?.message}>
              <input
                {...register("brandName")}
                className="field-input"
                placeholder="Display brand (optional)"
              />
            </Field>

            <Field label="Official email" error={errors.email?.message} required>
              <input
                {...register("email")}
                type="email"
                className="field-input"
                placeholder="contact@company.com"
              />
            </Field>

            <Field label="Sector / category" error={errors.sector?.message}>
              <input
                {...register("sector")}
                className="field-input"
                placeholder="e.g. Outdoor Advertising"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Contact person" error={errors.contactPerson?.message}>
                <input {...register("contactPerson")} className="field-input" />
              </Field>
              <Field label="Contact phone" error={errors.contactPhone?.message}>
                <input {...register("contactPhone")} type="tel" className="field-input" />
              </Field>
            </div>

            <Field label="Main branch location" error={errors.branchLocation?.message}>
              <input
                {...register("branchLocation")}
                className="field-input"
                placeholder="City, area, or full address"
              />
            </Field>

            <Field label="Organization type" error={errors.type?.message} required>
              <select {...register("type")} className="field-input">
                <option value="owner">AdSpace Owner</option>
                <option value="advertiser">Advertiser</option>
              </select>
            </Field>

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-tabellone-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Register organization"}
              </button>
              <Link
                href="/"
                className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
