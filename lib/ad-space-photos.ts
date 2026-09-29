export const MAX_AD_SPACE_PHOTOS = 3;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const IMAGE_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
} as const;

export type AllowedImageMime = keyof typeof IMAGE_MIME_TO_EXT;

export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif";

export function sniffImageMime(bytes: Uint8Array): AllowedImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 6) {
    const header = String.fromCharCode(...bytes.slice(0, 6));
    if (header === "GIF87a" || header === "GIF89a") return "image/gif";
  }
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    if (riff === "RIFF" && webp === "WEBP") return "image/webp";
    const ftyp = String.fromCharCode(...bytes.slice(4, 8));
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (ftyp === "ftyp" && (brand === "avif" || brand === "avis")) return "image/avif";
  }
  return null;
}

const LOCAL_UPLOAD_PHOTO_RE =
  /^\/uploads\/ad-spaces\/[a-z0-9-]+\/[a-z0-9-]+\.(jpe?g|png|webp|gif|avif)$/i;
const PUBLIC_SAMPLE_PHOTO_RE =
  /^\/ad-spaces\/[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|gif|avif)$/i;
const VERCEL_BLOB_PHOTO_RE =
  /^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\/.+\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i;

export function isStoredAdSpacePhotoUrl(url: string) {
  return (
    LOCAL_UPLOAD_PHOTO_RE.test(url) ||
    PUBLIC_SAMPLE_PHOTO_RE.test(url) ||
    VERCEL_BLOB_PHOTO_RE.test(url)
  );
}

/** New uploads must match stored patterns; existing rows may keep their current URLs. */
export function isAllowedAdSpacePhotoUrl(url: string, alreadyStored: string[]) {
  return isStoredAdSpacePhotoUrl(url) || alreadyStored.includes(url);
}

export function adSpacePhotos(space: {
  photoUrl?: string | null;
  photoUrls?: string[] | null;
}): string[] {
  const fromList = (space.photoUrls ?? []).filter(Boolean).slice(0, MAX_AD_SPACE_PHOTOS);
  if (fromList.length) return fromList;
  return space.photoUrl ? [space.photoUrl] : [];
}

export function normalizePhotoUrls(urls: Array<string | null | undefined>): string[] {
  return urls.filter((url): url is string => Boolean(url)).slice(0, MAX_AD_SPACE_PHOTOS);
}
