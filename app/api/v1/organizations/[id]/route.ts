import { NextResponse } from "next/server";
import { getOrganizationById } from "@/lib/services/organization.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const organization = await getOrganizationById(id);

  if (!organization) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Organization not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json(organization);
}
