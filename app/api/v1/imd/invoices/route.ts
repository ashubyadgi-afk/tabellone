import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/services/imd.service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const items = await prisma.invoice.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { issuedAt: "desc" },
    include: {
      booking: {
        include: { adSpace: true, client: true },
      },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });

  const { bookingId } = await request.json();
  if (!bookingId) {
    return NextResponse.json({ error: { message: "bookingId required" } }, { status: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, organizationId: session.organizationId },
    include: { invoice: true },
  });

  if (!booking) {
    return NextResponse.json({ error: { message: "Booking not found" } }, { status: 404 });
  }
  if (booking.invoice) {
    return NextResponse.json({ error: { message: "Invoice already exists" } }, { status: 409 });
  }

  const invoiceNumber = await generateInvoiceNumber(session.organizationId);

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: session.organizationId,
      bookingId: booking.id,
      invoiceNumber,
      totalAmount: booking.amount ?? 0,
      status: "issued",
    },
    include: {
      booking: { include: { adSpace: true, client: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
