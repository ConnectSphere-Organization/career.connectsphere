import "server-only";

import { z } from "zod";

import { env } from "@/config/env";

const resultSchema = z.object({
  clean: z.boolean(),
  threat: z.string().optional(),
});

export async function assertUploadIsClean(file: File): Promise<void> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const sample = bytes
    .subarray(0, Math.min(bytes.length, 64 * 1024))
    .toString("latin1");
  if (
    sample.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE") ||
    (bytes[0] === 0x4d && bytes[1] === 0x5a) ||
    (bytes[0] === 0x7f &&
      bytes[1] === 0x45 &&
      bytes[2] === 0x4c &&
      bytes[3] === 0x46)
  )
    throw new Error("Upload was rejected by malware screening");
  if (!env.MALWARE_SCAN_URL) {
    if (env.NODE_ENV === "production")
      throw new Error("Production malware scanning is not configured");
    return;
  }
  const response = await fetch(env.MALWARE_SCAN_URL, {
    method: "POST",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name),
      ...(env.MALWARE_SCAN_TOKEN
        ? { authorization: `Bearer ${env.MALWARE_SCAN_TOKEN}` }
        : {}),
    },
    body: bytes,
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  const result = resultSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (!response.ok || !result.success)
    throw new Error("Malware scanner is unavailable");
  if (!result.data.clean)
    throw new Error(
      `Upload was rejected by malware screening${result.data.threat ? `: ${result.data.threat}` : ""}`,
    );
}
