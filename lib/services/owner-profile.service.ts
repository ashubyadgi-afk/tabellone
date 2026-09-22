import { prisma } from "@/lib/db";
import { z } from "zod";

export const updateOwnerProfileSchema = z.object({
  name: z.string().min(2).max(200),
  brandName: z.string().max(200).optional().nullable(),
  sector: z.string().max(200).optional().nullable(),
  contactPerson: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  branchLocation: z.string().max(300).optional().nullable(),
  agencyName: z.string().max(200).optional().nullable(),
  officeAddress: z.string().max(500).optional().nullable(),
});

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getOwnerProfile(userId: string, organizationId: string) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, type: "owner" },
    include: { ownerProfile: true },
  });
  if (!org) return null;

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { email: true },
  });
  if (!user) return null;

  return {
    email: user.email,
    name: org.name,
    brandName: org.brandName,
    sector: org.sector,
    contactPerson: org.contactPerson,
    contactPhone: org.contactPhone,
    branchLocation: org.branchLocation,
    agencyName: org.ownerProfile?.agencyName ?? null,
    officeAddress: org.ownerProfile?.officeAddress ?? null,
    verificationStatus: org.ownerProfile?.verificationStatus ?? null,
  };
}

export async function updateOwnerProfile(
  userId: string,
  organizationId: string,
  input: z.infer<typeof updateOwnerProfileSchema>
) {
  const data = updateOwnerProfileSchema.parse(input);
  const existing = await getOwnerProfile(userId, organizationId);
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name.trim(),
        brandName: emptyToNull(data.brandName),
        sector: emptyToNull(data.sector),
        contactPerson: emptyToNull(data.contactPerson),
        contactPhone: emptyToNull(data.contactPhone),
        branchLocation: emptyToNull(data.branchLocation),
      },
    });

    await tx.ownerProfile.upsert({
      where: { organizationId },
      create: {
        userId,
        organizationId,
        agencyName: emptyToNull(data.agencyName),
        officeAddress: emptyToNull(data.officeAddress),
        verificationStatus: "approved",
      },
      update: {
        agencyName: emptyToNull(data.agencyName),
        officeAddress: emptyToNull(data.officeAddress),
      },
    });
  });

  return getOwnerProfile(userId, organizationId);
}
