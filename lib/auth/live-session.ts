import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getRoleHomePath,
  getSession,
  type SessionPayload,
} from "@/lib/auth/session";

export type LiveSession =
  | { status: "anonymous" }
  | { status: "stale" }
  | {
      status: "ok";
      session: SessionPayload;
      organizationName: string | null;
    };

function isInvalidId(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2023"
  );
}

/** Session cookie checked against the current user and organization. */
export async function getLiveSession(): Promise<LiveSession> {
  const session = await getSession();
  if (!session?.userId) return { status: "anonymous" };

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        organizationId: true,
        organization: { select: { id: true, name: true } },
      },
    });
  } catch (error) {
    if (isInvalidId(error)) return { status: "stale" };
    throw error;
  }

  if (!user || user.status !== "active") return { status: "stale" };

  if (user.role !== "admin") {
    if (!user.organizationId || !user.organization) return { status: "stale" };
  }

  return {
    status: "ok",
    session: {
      userId: user.id,
      organizationId: user.organizationId ?? "",
      role: user.role,
      email: user.email,
    },
    organizationName: user.organization?.name ?? null,
  };
}

export function redirectIfSessionUnusable(
  live: LiveSession
): asserts live is {
  status: "ok";
  session: SessionPayload;
  organizationName: string | null;
} {
  if (live.status === "stale") redirect("/api/v1/auth/session-reset");
  if (live.status === "anonymous") redirect("/login");
}

export function redirectToRoleArea(
  live: LiveSession,
  role: SessionPayload["role"]
): { session: SessionPayload; organizationName: string | null } {
  redirectIfSessionUnusable(live);
  if (live.session.role !== role) {
    redirect(getRoleHomePath(live.session.role));
  }
  return {
    session: live.session,
    organizationName: live.organizationName,
  };
}
