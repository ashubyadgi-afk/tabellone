import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ id?: string; name?: string }>;
};

export default async function OrganizationSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id ?? "";
  const name = params.name ?? "Your organization";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/" className="text-xl font-bold text-tabellone-primary">
            Tabellone
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
            ✓
          </div>
          <h1 className="mt-6 text-2xl font-bold text-tabellone-primary">
            Organization registered
          </h1>
          <p className="mt-3 text-slate-600">
            <strong>{name}</strong> has been added to Tabellone.
          </p>
          {id && (
            <p className="mt-2 text-sm text-slate-500">
              Organization ID: <code className="rounded bg-slate-100 px-2 py-0.5">{id}</code>
            </p>
          )}
          <p className="mt-4 text-sm text-slate-500">
            Next steps: complete owner/advertiser onboarding and verification (M3).
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/organizations/new"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              Add another
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-tabellone-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
