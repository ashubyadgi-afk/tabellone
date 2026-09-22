import { ZodError } from "zod";
import { apiError } from "@/lib/api/errors";
import {
  createOrganization,
  isDuplicateEmailError,
} from "@/lib/services/organization.service";
import { createOrganizationSchema } from "@/lib/validation/organization";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        field: e.path.join(".") || "body",
        message: e.message,
      }));
      return apiError("VALIDATION_ERROR", "Invalid organization data", 400, details);
    }

    const organization = await createOrganization(parsed.data);
    return Response.json(organization, { status: 201 });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return apiError(
        "DUPLICATE_EMAIL",
        "An organization with this official email already exists",
        409
      );
    }

    console.error("POST /organizations failed:", error);
    return apiError("INTERNAL_ERROR", "Unable to create organization", 500);
  }
}

export async function GET() {
  const { prisma } = await import("@/lib/db");
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({
    items: orgs.map((org) => ({
      id: org.id,
      name: org.name,
      email: org.email,
      type: org.type,
      status: org.status,
      createdAt: org.createdAt.toISOString(),
    })),
    total: orgs.length,
  });
}
