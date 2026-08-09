import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { env } from "@/config/env";

const prefix = "secret:v1";

function key(): Buffer {
  const configured = env.WEBHOOK_ENCRYPTION_KEY ?? env.CONTRACT_ENCRYPTION_KEY;
  if (!configured) {
    if (env.NODE_ENV === "production")
      throw new Error("Webhook encryption is not configured");
    return createHash("sha256")
      .update(`webhook-encryption:${env.BETTER_AUTH_SECRET}`)
      .digest();
  }
  const decoded = Buffer.from(configured, "base64");
  if (decoded.length !== 32)
    throw new Error("Webhook encryption key must decode to 32 bytes");
  return decoded;
}

export function encryptSecret(value: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), nonce);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    prefix,
    nonce.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSecret(value: string): string {
  const [marker, version, nonce, tag, ciphertext] = value.split(":");
  if (`${marker}:${version}` !== prefix || !nonce || !tag || !ciphertext)
    throw new Error("Invalid encrypted secret");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(nonce, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
