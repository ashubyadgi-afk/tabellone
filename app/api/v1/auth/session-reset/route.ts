import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

/** Drop a session that no longer matches a user, then show the login form. */
export async function GET(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url));
}
