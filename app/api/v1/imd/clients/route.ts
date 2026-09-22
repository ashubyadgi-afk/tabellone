import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  businessName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const items = await prisma.client.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    include: { bookings: { take: 3, orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { message: "Validation failed" } }, { status: 400 });
  }

  const data = parsed.data;
  const client = await prisma.client.create({
    data: {
      organizationId: session.organizationId,
      name: data.name,
      businessName: data.businessName || undefined,
      email: data.email || undefined,
      contactPhone: data.contactPhone || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
    },
  });
  return NextResponse.json(client, { status: 201 });
}
