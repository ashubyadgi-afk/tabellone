import { NextResponse } from "next/server";
import { registerAdvertiser } from "@/lib/services/auth.service";
import { apiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerAdvertiser(body);

    if (result.error || !result.user || !result.organization) {
      return apiError("VALIDATION_ERROR", result.error || "Registration failed", 400);
    }

    return NextResponse.json({
      user: { id: result.user.id, email: result.user.email },
      organization: { id: result.organization.id, name: result.organization.name },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    return apiError("VALIDATION_ERROR", message, 400);
  }
}
