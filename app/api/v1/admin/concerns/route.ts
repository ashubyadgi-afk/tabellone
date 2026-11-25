import { NextResponse } from "next/server";
import { ConcernStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";

const STATUS = new Set<string>(Object.values(ConcernStatus));

export async function GET(request: Request) {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const where =
    status && STATUS.has(status)
      ? { status: status as ConcernStatus }
      : undefined;

  const concerns = await prisma.concern.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      organization: {
        select: { id: true, name: true, email: true, brandName: true },
      },
      repliedBy: { select: { id: true, email: true } },
    },
    take: 200,
  });

  return NextResponse.json({ data: concerns });
}
