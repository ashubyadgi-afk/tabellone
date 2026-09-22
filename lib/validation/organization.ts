import { z } from "zod";

export const organizationTypeSchema = z.enum(["owner", "advertiser"]);

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(200),
  brandName: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid official email"),
  sector: z.string().trim().max(100).optional().or(z.literal("")),
  contactPerson: z.string().trim().max(120).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  branchLocation: z.string().trim().max(300).optional().or(z.literal("")),
  type: organizationTypeSchema,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export function emptyToUndefined(value: string | undefined): string | undefined {
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}
