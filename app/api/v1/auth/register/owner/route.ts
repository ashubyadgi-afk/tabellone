import { NextResponse } from "next/server";
import { registerOwner, registerOwnerSchema } from "@/lib/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerOwnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: "Validation failed",
            details: parsed.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const result = await registerOwner(parsed.data);
    if (result.error) {
      return NextResponse.json({ error: { message: result.error } }, { status: 409 });
    }

    return NextResponse.json(
      {
        user: { id: result.user!.id, email: result.user!.email },
        organization: { id: result.organization!.id, name: result.organization!.name },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { message: "Registration failed" } }, { status: 500 });
  }
}
