import { NextResponse } from "next/server";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import {
  getAdvertiserAccount,
  updateAdvertiserAccount,
  updateAdvertiserAccountSchema,
} from "@/lib/services/advertiser-account.service";

export async function GET() {
  const session = await requireApiRole(["advertiser"]);
  if (!session?.organizationId) return unauthorized();

  const account = await getAdvertiserAccount(session.userId, session.organizationId);
  if (!account) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
  return NextResponse.json(account);
}

export async function PATCH(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session?.organizationId) return unauthorized();

  const body = await request.json();
  const parsed = updateAdvertiserAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.errors[0]?.message || "Validation failed" } },
      { status: 400 }
    );
  }

  const account = await updateAdvertiserAccount(
    session.userId,
    session.organizationId,
    parsed.data
  );
  if (!account) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
  return NextResponse.json(account);
}
