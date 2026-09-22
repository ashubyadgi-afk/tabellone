import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  createOrganizationSchema,
  emptyToUndefined,
  type CreateOrganizationInput,
} from "@/lib/validation/organization";

export type OrganizationDTO = {
  id: string;
  name: string;
  brandName: string | null;
  email: string;
  sector: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  branchLocation: string | null;
  type: string;
  status: string;
  createdAt: string;
};

function toDTO(org: {
  id: string;
  name: string;
  brandName: string | null;
  email: string;
  sector: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  branchLocation: string | null;
  type: string;
  status: string;
  createdAt: Date;
}): OrganizationDTO {
  return {
    id: org.id,
    name: org.name,
    brandName: org.brandName,
    email: org.email,
    sector: org.sector,
    contactPerson: org.contactPerson,
    contactPhone: org.contactPhone,
    branchLocation: org.branchLocation,
    type: org.type,
    status: org.status,
    createdAt: org.createdAt.toISOString(),
  };
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<OrganizationDTO> {
  const data = createOrganizationSchema.parse(input);

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      brandName: emptyToUndefined(data.brandName),
      email: data.email.toLowerCase(),
      sector: emptyToUndefined(data.sector),
      contactPerson: emptyToUndefined(data.contactPerson),
      contactPhone: emptyToUndefined(data.contactPhone),
      branchLocation: emptyToUndefined(data.branchLocation),
      type: data.type,
    },
  });

  return toDTO(org);
}

export async function getOrganizationById(id: string): Promise<OrganizationDTO | null> {
  const org = await prisma.organization.findUnique({ where: { id } });
  return org ? toDTO(org) : null;
}

export function isDuplicateEmailError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
