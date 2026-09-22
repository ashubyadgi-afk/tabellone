import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { storeAdSpacePhoto } from "@/lib/ad-space-storage";
import {
  IMAGE_MIME_TO_EXT,
  MAX_IMAGE_BYTES,
  sniffImageMime,
  type AllowedImageMime,
} from "@/lib/ad-space-photos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ error: { message: "Forbidden" } }, { status: 403 });
  }
  if (!session.organizationId) {
    return NextResponse.json({ error: { message: "No organization" } }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: { message: "Choose an image file." } }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: { message: "Each image must be 2 MB or smaller." } },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageMime(buffer);
  if (!sniffed) {
    return NextResponse.json(
      { error: { message: "Use JPG, PNG, WebP, GIF, or AVIF." } },
      { status: 400 }
    );
  }

  const declared = file.type as AllowedImageMime;
  if (declared && declared in IMAGE_MIME_TO_EXT && declared !== sniffed) {
    return NextResponse.json(
      { error: { message: "File type does not match the image contents." } },
      { status: 400 }
    );
  }

  try {
    const url = await storeAdSpacePhoto({
      organizationId: session.organizationId,
      buffer,
      contentType: sniffed,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not upload that image.";
    return NextResponse.json({ error: { message } }, { status: 503 });
  }
}
