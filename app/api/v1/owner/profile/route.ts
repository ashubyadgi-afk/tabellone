import { NextResponse } from "next/server";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import {
  getOwnerProfile,
  updateOwnerProfile,
  updateOwnerProfileSchema,
} from "@/lib/services/owner-profile.service";

export async function GET() {
  const session = await requireApiRole(["owner"]);
  if (!session?.organizationId) return unauthorized();

  const profile = await getOwnerProfile(session.userId, session.organizationId);
  if (!profile) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const session = await requireApiRole(["owner"]);
  if (!session?.organizationId) return unauthorized();

  const body = await request.json();
  const parsed = updateOwnerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.errors[0]?.message || "Validation failed",
          details: parsed.error.errors,
        },
      },
      { status: 400 }
    );
  }

  const profile = await updateOwnerProfile(
    session.userId,
    session.organizationId,
    parsed.data
  );
  if (!profile) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
  return NextResponse.json(profile);
}
