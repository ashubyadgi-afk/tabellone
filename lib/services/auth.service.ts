import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerOwnerSchema = z.object({
  organizationName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  branchLocation: z.string().optional(),
});

export const registerAdvertiserSchema = z.object({
  organizationName: z.string().min(2).max(200),
  brandName: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  sector: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  branchLocation: z.string().optional(),
});

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { organization: true },
  });

  if (!user || user.status !== "active") {
    return { error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  if (user.role !== "admin" && !user.organizationId) {
    return { error: "Account is not linked to an organization" };
  }

  await createSession({
    userId: user.id,
    organizationId: user.organizationId ?? "",
    role: user.role,
    email: user.email,
  });

  return { user, organization: user.organization };
}

export async function registerOwner(data: z.infer<typeof registerOwnerSchema>) {
  const parsed = registerOwnerSchema.parse(data);
  const email = parsed.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(parsed.password);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: parsed.organizationName,
        email,
        contactPerson: parsed.contactPerson,
        contactPhone: parsed.contactPhone,
        branchLocation: parsed.branchLocation,
        type: "owner",
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "owner",
        organizationId: org.id,
      },
    });

    await tx.ownerProfile.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        verificationStatus: "approved",
      },
    });

    await tx.wallet.create({ data: { organizationId: org.id } });

    return { user, org };
  });

  await createSession({
    userId: result.user.id,
    organizationId: result.org.id,
    role: "owner",
    email: result.user.email,
  });

  return { user: result.user, organization: result.org };
}

export async function registerAdvertiser(
  data: z.infer<typeof registerAdvertiserSchema>
) {
  const parsed = registerAdvertiserSchema.parse(data);
  const email = parsed.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(parsed.password);
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { tier: "free" },
  });

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: parsed.organizationName,
        brandName: parsed.brandName,
        email,
        sector: parsed.sector,
        contactPerson: parsed.contactPerson,
        contactPhone: parsed.contactPhone,
        branchLocation: parsed.branchLocation,
        type: "advertiser",
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "advertiser",
        organizationId: org.id,
      },
    });

    await tx.advertiserProfile.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        verificationStatus: "approved",
      },
    });

    await tx.wallet.create({ data: { organizationId: org.id } });

    if (freePlan) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planId: freePlan.id,
          status: "active",
          startsAt: new Date(),
          expiresAt: expires,
        },
      });
    }

    return { user, org };
  });

  await createSession({
    userId: result.user.id,
    organizationId: result.org.id,
    role: "advertiser",
    email: result.user.email,
  });

  return { user: result.user, organization: result.org };
}
