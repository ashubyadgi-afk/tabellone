import { NextResponse } from "next/server";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import {
  changeAdvertiserPassword,
  changeAdvertiserPasswordSchema,
} from "@/lib/services/advertiser-account.service";

export async function POST(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session?.organizationId) return unauthorized();

  const body = await request.json();
  const parsed = changeAdvertiserPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.errors[0]?.message || "Validation failed" } },
      { status: 400 }
    );
  }

  const result = await changeAdvertiserPassword(
    session.userId,
    session.organizationId,
    parsed.data.currentPassword,
    parsed.data.newPassword
  );
  if (result.error) {
    return NextResponse.json({ error: { message: result.error } }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
