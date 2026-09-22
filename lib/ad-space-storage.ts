import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { IMAGE_MIME_TO_EXT, type AllowedImageMime } from "@/lib/ad-space-photos";

export async function storeAdSpacePhoto(input: {
  organizationId: string;
  buffer: Buffer;
  contentType: AllowedImageMime;
}): Promise<string> {
  const ext = IMAGE_MIME_TO_EXT[input.contentType];
  const filename = `${randomUUID()}.${ext}`;
  const blobPath = `ad-spaces/${input.organizationId}/${filename}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(blobPath, input.buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: input.contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Photo storage is not configured. Add a Vercel Blob store and BLOB_READ_WRITE_TOKEN."
    );
  }

  const relativeDir = path.posix.join("uploads", "ad-spaces", input.organizationId);
  const absDir = path.join(process.cwd(), "public", "uploads", "ad-spaces", input.organizationId);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, filename), input.buffer);
  return `/${relativeDir}/${filename}`;
}
