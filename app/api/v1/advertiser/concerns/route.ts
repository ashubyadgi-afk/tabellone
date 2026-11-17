import { NextResponse } from "next/server";
import { ConcernTopic } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiRole, unauthorized } from "@/lib/api/auth-guard";
import { apiError } from "@/lib/api/errors";

const TOPICS = new Set<string>(Object.values(ConcernTopic));

export async function GET() {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const concerns = await prisma.concern.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: concerns });
}

export async function POST(request: Request) {
  const session = await requireApiRole(["advertiser"]);
  if (!session || !session.organizationId) return unauthorized();

  const body = await request.json();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const topic = String(body.topic || "");

  if (!TOPICS.has(topic)) return apiError("VALIDATION_ERROR", "Choose what this query is about", 400);
  if (!subject) return apiError("VALIDATION_ERROR", "Subject is required", 400);
  if (!message) return apiError("VALIDATION_ERROR", "Message is required", 400);

  const concern = await prisma.concern.create({
    data: {
      organizationId: session.organizationId,
      topic: topic as ConcernTopic,
      subject,
      message,
    },
  });

  return NextResponse.json({ data: concern });
}
