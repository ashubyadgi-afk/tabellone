import { prisma } from "@/lib/db";
import { PageHeader, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      users: { select: { email: true, role: true } },
      ownerProfile: true,
      advertiserProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Users & organizations" description="All platform tenants" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-3">Organization</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Users</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orgs.map((org) => (
              <tr key={org.id}>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.email}</p>
                </td>
                <td className="px-6 py-4 capitalize text-slate-600">{org.type}</td>
                <td className="px-6 py-4 text-slate-600">
                  {org.users.map((u) => u.email).join(", ")}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={org.status === "active" ? "success" : "muted"}>
                    {org.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {formatDate(org.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
