import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { z } from "zod";

export const updateAdvertiserAccountSchema = z.object({
  name: z.string().min(2, "Company name is required").max(200),
  brandName: z.string().max(200).optional().nullable(),
  sector: z.string().max(200).optional().nullable(),
  contactPerson: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  branchLocation: z.string().max(300).optional().nullable(),
  gstNumber: z.string().max(20).optional().nullable(),
  panNumber: z.string().max(10).optional().nullable(),
});

export const changeAdvertiserPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getAdvertiserAccount(userId: string, organizationId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId, role: "advertiser" },
    select: { email: true, createdAt: true, status: true },
  });
  if (!user) return null;

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, type: "advertiser" },
    include: { advertiserProfile: true },
  });
  if (!org) return null;

  return {
    email: user.email,
    accountStatus: user.status,
    memberSince: user.createdAt,
    name: org.name,
    brandName: org.brandName,
    sector: org.sector,
    contactPerson: org.contactPerson,
    contactPhone: org.contactPhone,
    branchLocation: org.branchLocation,
    gstNumber: org.advertiserProfile?.gstNumber ?? null,
    panNumber: org.advertiserProfile?.panNumber ?? null,
    verificationStatus: org.advertiserProfile?.verificationStatus ?? null,
  };
}

export async function updateAdvertiserAccount(
  userId: string,
  organizationId: string,
  input: z.infer<typeof updateAdvertiserAccountSchema>
) {
  const data = updateAdvertiserAccountSchema.parse(input);
  const existing = await getAdvertiserAccount(userId, organizationId);
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

    await tx.advertiserProfile.upsert({
      where: { organizationId },
      create: {
        userId,
        organizationId,
        gstNumber: emptyToNull(data.gstNumber)?.toUpperCase() ?? null,
        panNumber: emptyToNull(data.panNumber)?.toUpperCase() ?? null,
        verificationStatus: "approved",
      },
      update: {
        gstNumber: emptyToNull(data.gstNumber)?.toUpperCase() ?? null,
        panNumber: emptyToNull(data.panNumber)?.toUpperCase() ?? null,
      },
    });
  });

  return getAdvertiserAccount(userId, organizationId);
}

export async function changeAdvertiserPassword(
  userId: string,
  organizationId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId, role: "advertiser" },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Account not found" };

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) return { error: "Current password is incorrect" };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { ok: true };
}
