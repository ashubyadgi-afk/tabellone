import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { checkBookingConflict } from "@/lib/services/imd.service";
import { z } from "zod";

const schema = z.object({
  adSpaceId: z.string().uuid(),
  clientId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  amount: z.number().optional(),
  campaignReference: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["draft", "confirmed", "active", "completed", "cancelled"]).default("confirmed"),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const items = await prisma.booking.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { startDate: "desc" },
    include: { adSpace: true, client: true, invoice: true },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Validation failed", details: parsed.error.errors } }, { status: 400 });
  }

  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (endDate < startDate) {
    return NextResponse.json({ error: { message: "End date must be after start date" } }, { status: 400 });
  }

  const conflict = await checkBookingConflict(
    session.organizationId,
    parsed.data.adSpaceId,
    startDate,
    endDate
  );
  if (conflict) {
    return NextResponse.json(
      { error: { message: "This Ad Space already has a booking for overlapping dates" } },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      organizationId: session.organizationId,
      adSpaceId: parsed.data.adSpaceId,
      clientId: parsed.data.clientId,
      startDate,
      endDate,
      amount: parsed.data.amount,
      campaignReference: parsed.data.campaignReference,
      notes: parsed.data.notes,
      status: parsed.data.status,
    },
    include: { adSpace: true, client: true },
  });
  return NextResponse.json(booking, { status: 201 });
}
