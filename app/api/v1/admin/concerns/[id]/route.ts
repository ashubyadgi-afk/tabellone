import { NextResponse } from "next/server";
import { ConcernStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { apiError } from "@/lib/api/errors";

const STATUS = new Set<string>(Object.values(ConcernStatus));

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireApiRole(["admin"]);
  if (!session) return unauthorized();

  const { id } = await context.params;
  const body = await request.json();
  const reply = body.reply != null ? String(body.reply).trim() : undefined;
  const status = body.status != null ? String(body.status) : undefined;

  if (status && !STATUS.has(status)) {
    return apiError("VALIDATION_ERROR", "Choose a valid status", 400);
  }
  if (reply !== undefined && !reply) {
    return apiError("VALIDATION_ERROR", "Reply cannot be empty", 400);
  }
  if (reply === undefined && status === undefined) {
    return apiError("VALIDATION_ERROR", "Nothing to update", 400);
  }

  const existing = await prisma.concern.findUnique({ where: { id } });
  if (!existing) return apiError("NOT_FOUND", "Query not found", 404);

  const nextStatus =
    (status as ConcernStatus | undefined) ??
    (reply ? ("resolved" as ConcernStatus) : existing.status);

  const concern = await prisma.concern.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(reply !== undefined
        ? {
            reply,
            repliedAt: new Date(),
            repliedByUserId: session.userId,
          }
        : {}),
    },
    include: {
      organization: {
        select: { id: true, name: true, email: true, brandName: true },
      },
      repliedBy: { select: { id: true, email: true } },
    },
  });

  return NextResponse.json({ data: concern });
}
