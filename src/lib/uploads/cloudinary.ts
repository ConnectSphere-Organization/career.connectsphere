import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import { env } from "@/config/env";
import { assertUploadIsClean } from "@/lib/security/upload-scanner";

const uploadResultSchema = z.object({
  secure_url: z.url().startsWith("https://"),
  public_id: z.string().min(1),
});

const destroyResultSchema = z.object({ result: z.enum(["ok", "not found"]) });

export type UploadedAsset = {
  url: string;
  publicId: string;
};

export type AssetKind = "private-document" | "job-image";

function credentials() {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Document uploads are not configured");
  }
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
}

function signature(params: Record<string, string>, secret: string): string {
  const serialized = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${secret}`).digest("hex");
}

export async function uploadPrivateDocument(
  file: File,
  folder: "resumes" | "application-answers" | "contract-documents",
): Promise<UploadedAsset> {
  await assertUploadIsClean(file);
  const { cloudName, apiKey, apiSecret } = credentials();
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const signed = { folder, timestamp, type: "authenticated" };
  const body = new FormData();
  body.set("file", file, file.name);
  body.set("api_key", apiKey);
  body.set("folder", folder);
  body.set("timestamp", timestamp);
  body.set("type", "authenticated");
  body.set("signature", signature(signed, apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    {
      method: "POST",
      body,
      signal: AbortSignal.timeout(60_000),
    },
  );
  const parsed = uploadResultSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!response.ok || !parsed.success)
    throw new Error("Secure document upload failed");
  return { url: parsed.data.secure_url, publicId: parsed.data.public_id };
}

export async function uploadJobImage(file: File): Promise<UploadedAsset> {
  if (file.size === 0) throw new Error("Job image is required");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Job image must be 5 MB or smaller");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Job image must be JPEG, PNG, or WebP");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes
    .slice(0, 8)
    .every(
      (value, index) =>
        value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index],
    );
  const webp =
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (!jpeg && !png && !webp)
    throw new Error("Job image content does not match its declared type");
  await assertUploadIsClean(file);

  const { cloudName, apiKey, apiSecret } = credentials();
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const signed = { folder: "job-images", timestamp };
  const body = new FormData();
  body.set("file", file, file.name);
  body.set("api_key", apiKey);
  body.set("folder", "job-images");
  body.set("timestamp", timestamp);
  body.set("signature", signature(signed, apiSecret));
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body, signal: AbortSignal.timeout(60_000) },
  );
  const parsed = uploadResultSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!response.ok || !parsed.success)
    throw new Error("Job image upload failed");
  return { url: parsed.data.secure_url, publicId: parsed.data.public_id };
}

export async function deletePrivateDocument(publicId: string): Promise<void> {
  await deleteCloudinaryAsset(publicId, "private-document");
}

export async function deleteCloudinaryAsset(
  publicId: string,
  kind: AssetKind,
): Promise<void> {
  const { cloudName, apiKey, apiSecret } = credentials();
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const type = kind === "private-document" ? "authenticated" : "upload";
  const signed = { public_id: publicId, timestamp, type };
  const body = new URLSearchParams({
    api_key: apiKey,
    public_id: publicId,
    timestamp,
    type,
    signature: signature(signed, apiSecret),
  });
  const resourceType = kind === "private-document" ? "raw" : "image";
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    {
      method: "POST",
      body,
      signal: AbortSignal.timeout(30_000),
    },
  );
  const parsed = destroyResultSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!response.ok || !parsed.success) throw new Error("Media cleanup failed");
}

export function privateDocumentDownloadUrl(publicId: string): string {
  const { cloudName, apiKey, apiSecret } = credentials();
  const timestamp = Math.floor(Date.now() / 1_000).toString();
  const signed = { public_id: publicId, timestamp, type: "authenticated" };
  const query = new URLSearchParams({
    api_key: apiKey,
    ...signed,
    signature: signature(signed, apiSecret),
  });
  return `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?${query.toString()}`;
}
