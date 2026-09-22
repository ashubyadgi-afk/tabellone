import { NextResponse } from "next/server";
import { getNotificationsForUser, markNotificationRead } from "@/lib/services/notification.service";
import { getSession } from "@/lib/auth/session";
import { unauthorized } from "@/lib/api/auth-guard";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const notifications = await getNotificationsForUser(
    session.userId,
    session.organizationId
  );
  return NextResponse.json({ data: notifications });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await request.json();
  await markNotificationRead(id);
  return NextResponse.json({ ok: true });
}
