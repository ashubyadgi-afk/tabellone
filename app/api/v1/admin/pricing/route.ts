import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { getPricingConfig } from "@/lib/services/pricing.service";
import { apiError } from "@/lib/api/errors";

export async function GET() {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const config = await getPricingConfig();
  return NextResponse.json({ data: config });
}

export async function PATCH(request: Request) {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const body = await request.json();
  const updated = await prisma.pricingConfig.update({
    where: { id: "default" },
    data: {
      commissionRate: body.commissionRate,
      gstRate: body.gstRate,
      tdsRate: body.tdsRate,
      platformGstRate: body.platformGstRate,
    },
  });

  return NextResponse.json({ data: updated });
}
