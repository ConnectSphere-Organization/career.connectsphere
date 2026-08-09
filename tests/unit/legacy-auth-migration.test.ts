import { describe, expect, it } from "vitest";

import {
  isSupportedLegacyPasswordHash,
  needsCredentialAccountMigration,
} from "@/lib/auth/legacy-migration";

describe("legacy Better Auth credential migration", () => {
  const bcryptHash =
    "$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO123456789";

  it("recognizes bcrypt hashes used by the MERN application", () => {
    expect(isSupportedLegacyPasswordHash(bcryptHash)).toBe(true);
    expect(isSupportedLegacyPasswordHash("plaintext-password")).toBe(false);
    expect(isSupportedLegacyPasswordHash(null)).toBe(false);
  });

  it("migrates only users that lack an existing credential account", () => {
    expect(
      needsCredentialAccountMigration({
        password: bcryptHash,
        credentialAccountCount: 0,
      }),
    ).toBe(true);
    expect(
      needsCredentialAccountMigration({
        password: bcryptHash,
        credentialAccountCount: 1,
      }),
    ).toBe(false);
    expect(
      needsCredentialAccountMigration({
        password: null,
        credentialAccountCount: 0,
      }),
    ).toBe(false);
  });
});
