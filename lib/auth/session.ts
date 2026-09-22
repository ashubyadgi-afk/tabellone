import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "tabellone_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "tabellone-dev-secret-change-in-production"
);

export type SessionPayload = {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({
    userId: payload.userId,
    organizationId: payload.organizationId ?? "",
    role: payload.role,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const orgId = payload.organizationId as string;
    return {
      userId: payload.userId as string,
      organizationId: (payload.organizationId as string) || "",
      role: payload.role as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(
  roles: string[]
): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function getRoleHomePath(role: string): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "owner":
      return "/owner/dashboard";
    case "advertiser":
      return "/advertiser/dashboard";
    default:
      return "/";
  }
}

export function requireOrganizationId(session: SessionPayload): string {
  if (!session.organizationId) {
    throw new Error("NO_ORGANIZATION");
  }
  return session.organizationId;
}