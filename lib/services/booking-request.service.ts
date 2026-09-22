import { prisma } from "@/lib/db";
import { calculatePricingFromDb } from "./pricing.service";
import { checkAvailability } from "./marketplace.service";
import { createNotification } from "./notification.service";

export async function submitBookingRequest(data: {
  organizationId: string;
  adSpaceId: string;
  campaignId?: string;
  startDate: Date;
  endDate: Date;
  creativeUrl?: string;
  campaignNotes?: string;
}) {
  const adSpace = await prisma.adSpace.findFirst({
    where: {
      id: data.adSpaceId,
      marketplaceListingStatus: "listed",
    },
  });

  if (!adSpace || !adSpace.basePrice) {
    return { error: "Ad space not available for booking" };
  }

  const available = await checkAvailability(
    data.adSpaceId,
    data.startDate,
    data.endDate
  );
  if (!available) {
    return { error: "Selected dates are not available" };
  }

  const pricing = await calculatePricingFromDb(adSpace.basePrice);

  const request = await prisma.bookingRequest.create({
    data: {
      organizationId: data.organizationId,
      adSpaceId: data.adSpaceId,
      campaignId: data.campaignId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: "submitted",
      basePrice: pricing.basePrice,
      commissionAmount: pricing.commissionAmount,
      gstOnCommission: pricing.gstOnCommission,
      tdsAmount: pricing.tdsAmount,
      ownerPayout: pricing.ownerPayout,
      customerPrice: pricing.customerPrice,
      creativeUrl: data.creativeUrl,
      campaignNotes: data.campaignNotes,
    },
    include: { adSpace: true },
  });

  await createNotification({
    type: "booking",
    title: "New booking request",
    message: `Booking request for ${adSpace.name} submitted for review.`,
    link: "/admin/booking-requests",
  });

  return { request };
}

export async function reviewBookingRequest(
  id: string,
  action: "approve" | "reject",
  reviewNotes?: string
) {
  const request = await prisma.bookingRequest.findUnique({
    where: { id },
    include: { adSpace: true, organization: true },
  });
  if (!request) return { error: "Request not found" };

  const status =
    action === "approve" ? "payment_pending" : "rejected";

  const updated = await prisma.bookingRequest.update({
    where: { id },
    data: {
      status,
      reviewNotes,
      reviewedAt: new Date(),
    },
  });

  await createNotification({
    organizationId: request.organizationId,
    type: action === "approve" ? "approval" : "rejection",
    title:
      action === "approve"
        ? "Booking request approved"
        : "Booking request rejected",
    message:
      action === "approve"
        ? `Your request for ${request.adSpace.name} is approved. Complete payment to confirm.`
        : `Your request for ${request.adSpace.name} was rejected.`,
    link: "/advertiser/booking-requests",
  });

  return { request: updated };
}

export async function processPayment(
  bookingRequestId: string,
  organizationId: string,
  method: "upi" | "card" | "wallet" | "bank_transfer"
) {
  const request = await prisma.bookingRequest.findFirst({
    where: {
      id: bookingRequestId,
      organizationId,
      status: "payment_pending",
    },
  });

  if (!request) return { error: "Booking request not available for payment" };

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        organizationId,
        bookingRequestId,
        amount: request.customerPrice,
        method,
        status: "completed",
        transactionRef: `TXN-${Date.now()}`,
        paidAt: new Date(),
      },
    });

    await tx.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: "confirmed" },
    });

    return p;
  });

  await createNotification({
    organizationId: request.organizationId,
    type: "payment",
    title: "Payment successful",
    message: `Payment of ₹${request.customerPrice.toLocaleString("en-IN")} confirmed.`,
    link: "/advertiser/booking-requests",
  });

  const adSpace = await prisma.adSpace.findUnique({
    where: { id: request.adSpaceId },
  });
  if (adSpace) {
    await createNotification({
      organizationId: adSpace.organizationId,
      type: "booking",
      title: "New confirmed booking",
      message: `A marketplace booking was confirmed for ${adSpace.name}.`,
      link: "/owner/imd/bookings",
    });
  }

  return { payment };
}
