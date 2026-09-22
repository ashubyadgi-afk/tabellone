import { NextResponse } from "next/server";
import { loginUser } from "@/lib/services/auth.service";
import { getRoleHomePath } from "@/lib/auth/session";
import { apiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginUser(body.email, body.password);

    if (result.error || !result.user) {
      return apiError("UNAUTHORIZED", result.error || "Login failed", 401);
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      redirect: getRoleHomePath(result.user.role),
    });
  } catch {
    return apiError("INTERNAL_ERROR", "Login failed", 500);
  }
}
