import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getImdDashboardStats } from "@/lib/services/imd.service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const stats = await getImdDashboardStats(session.organizationId);
  return NextResponse.json(stats);
}
