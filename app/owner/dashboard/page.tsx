import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getImdDashboardStats } from "@/lib/services/imd.service";
import { getOwnerProfile } from "@/lib/services/owner-profile.service";
import { Card, StatCard, Button, PageHeader } from "@/components/ui";
import { Megaphone, Layers, CalendarDays, FileText, ArrowRight, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

export default async function OwnerDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [stats, profile] = await Promise.all([
    getImdDashboardStats(session.organizationId),
    getOwnerProfile(session.userId, session.organizationId),
  ]);

  return (
    <div>
      <PageHeader
        title="Owner Dashboard"
        description="Your Tabellone workspace — inventory, bookings, and revenue at a glance"
        action={
          <div className="flex gap-2">
            <Link href="/owner/profile/edit">
              <Button variant="secondary">
                <Pencil className="h-4 w-4" /> Edit profile
              </Button>
            </Link>
            <Link href="/owner/imd">
              <Button>
                Open IMD <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Ad Spaces"
          value={stats.totalAdSpaces}
          icon={Layers}
          accent="blue"
          href="/owner/imd/ad-spaces"
        />
        <StatCard
          label="Active inventory"
          value={stats.activeAdSpaces}
          icon={Megaphone}
          accent="emerald"
          href="/owner/imd/ad-spaces"
        />
        <StatCard
          label="Booked today"
          value={stats.currentlyBooked}
          icon={CalendarDays}
          accent="amber"
          href="/owner/imd/calendar"
        />
        <StatCard
          label="Revenue (this month)"
          value={formatCurrency(stats.invoiceTotalThisMonth)}
          sub={`${stats.invoicesThisMonth} invoices`}
          icon={FileText}
          accent="violet"
          href="/owner/imd/invoices"
        />
      </div>

      <Card className="mt-8 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">Your profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Company and contact details for this owner account
            </p>
          </div>
          <Link href="/owner/profile/edit">
            <Button variant="secondary" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
        </div>
        {profile ? (
          <div className="mt-4 grid gap-x-10 sm:grid-cols-2">
            <ProfileRow label="Organization" value={profile.name} />
            <ProfileRow label="Brand name" value={profile.brandName} />
            <ProfileRow label="Login email" value={profile.email} />
            <ProfileRow label="Contact person" value={profile.contactPerson} />
            <ProfileRow label="Phone" value={profile.contactPhone} />
            <ProfileRow label="Location" value={profile.branchLocation} />
            <ProfileRow label="Sector" value={profile.sector} />
            <ProfileRow label="Agency name" value={profile.agencyName} />
            <ProfileRow label="Office address" value={profile.officeAddress} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Profile details are not available.</p>
        )}
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { href: "/owner/imd/ad-spaces/new", label: "Add Ad Space" },
              { href: "/owner/imd/clients/new", label: "Add Client" },
              { href: "/owner/imd/bookings/new", label: "New Booking" },
              { href: "/owner/imd/calendar", label: "View Calendar" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#1e3a5f]/30 hover:bg-slate-50"
              >
                {a.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-4">
            <p className="text-sm font-medium text-orange-900">List Your AdSpace</p>
            <p className="mt-1 text-xs text-orange-700/80">
              Public marketplace listing — coming in Phase 2
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Recent bookings</h2>
          <ul className="mt-4 space-y-3">
            {stats.recentBookings.length === 0 ? (
              <p className="text-sm text-slate-500">No bookings yet</p>
            ) : (
              stats.recentBookings.map((b) => (
                <li key={b.id} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="font-medium">{b.adSpace.name}</span>
                  <span className="text-slate-500">{b.client.name}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
