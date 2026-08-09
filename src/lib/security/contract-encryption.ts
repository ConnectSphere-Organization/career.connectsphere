import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { env } from "@/config/env";

const prefix = "enc:v1";

function encryptionKey(): Buffer {
  if (!env.CONTRACT_ENCRYPTION_KEY) {
    if (env.NODE_ENV === "production")
      throw new Error("Contract encryption is not configured");
    return createHash("sha256")
      .update(`contract-encryption:${env.BETTER_AUTH_SECRET}`)
      .digest();
  }
  const key = Buffer.from(env.CONTRACT_ENCRYPTION_KEY, "base64");
  if (key.length !== 32)
    throw new Error("Contract encryption key must decode to 32 bytes");
  return key;
}

export function encryptContractValue(value: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    prefix,
    nonce.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptContractValue(value: string): string {
  const [marker, version, nonceValue, tagValue, ciphertextValue] =
    value.split(":");
  if (
    `${marker}:${version}` !== prefix ||
    !nonceValue ||
    !tagValue ||
    !ciphertextValue
  )
    throw new Error("Invalid encrypted contract value");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(nonceValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptContractPayload(value: unknown): string {
  return encryptContractValue(JSON.stringify(value));
}

export function decryptContractPayload<T>(value: string): T {
  return JSON.parse(decryptContractValue(value)) as T;
}

export function maskSensitiveValue(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const plain = value.startsWith(`${prefix}:`)
    ? decryptContractValue(value)
    : value;
  const compact = plain.replace(/\s/g, "");
  return compact.length <= 4 ? "••••" : `•••• ${compact.slice(-4)}`;
}
