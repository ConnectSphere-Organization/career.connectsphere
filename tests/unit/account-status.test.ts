import { describe, expect, it } from "vitest";

import {
  isActiveAccountStatus,
  isEnabledAccountStatus,
  normalizeAccountStatus,
} from "@/lib/auth/account-status";

describe("account status policy", () => {
  it.each(["ACTIVE", "active", " Active ", undefined, null])(
    "normalizes %s as active",
    (status) => {
      expect(isActiveAccountStatus(status)).toBe(true);
      expect(isEnabledAccountStatus(status)).toBe(true);
    },
  );

  it.each(["FORMER", "former"])(
    "allows former status %s for candidate-owned resources",
    (status) => {
      expect(isEnabledAccountStatus(status)).toBe(true);
      expect(isActiveAccountStatus(status)).toBe(false);
    },
  );

  it.each(["INACTIVE", "inactive", "SUSPENDED", "suspended"])(
    "blocks disabled status %s",
    (status) => {
      expect(isEnabledAccountStatus(status)).toBe(false);
    },
  );

  it("normalizes casing and whitespace", () => {
    expect(normalizeAccountStatus(" suspended ")).toBe("SUSPENDED");
  });
});
