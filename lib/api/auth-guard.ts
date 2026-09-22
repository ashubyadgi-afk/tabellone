import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth/session";

export async function getApiSession() {
  return getSession();
}

export async function requireApiRole(roles: string[]) {
  try {
    return await requireRole(roles);
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json(
    { error: { message: "Unauthorized" } },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: { message: "Forbidden" } },
    { status: 403 }
  );
}
