import { describe, expect, it, vi } from "vitest";
import { PositionLevel } from "@prisma/client";

import {
  isOAuthCallbackPath,
  normalizeLegacyAuthEnums,
} from "@/lib/auth/legacy-auth-enum-normalization";

describe("legacy auth enum normalization", () => {
  it("keeps legacy uppercase position levels readable during OAuth", () => {
    expect(PositionLevel.LEGACY_JUNIOR).toBe("LEGACY_JUNIOR");
    expect(PositionLevel.JUNIOR).toBe("JUNIOR");
  });

  it("runs on social OAuth callbacks", () => {
    expect(isOAuthCallbackPath("/api/auth/callback/google")).toBe(true);
    expect(isOAuthCallbackPath("/api/auth/sign-in/social")).toBe(false);
  });

  it("normalizes legacy user enums before an OAuth callback query", async () => {
    const runCommandRaw = vi.fn().mockResolvedValue({ n: 0, nModified: 0 });

    await normalizeLegacyAuthEnums(runCommandRaw);

    const commands = runCommandRaw.mock.calls.map(([command]) =>
      JSON.stringify(command),
    );
    expect(commands).toHaveLength(3);
    expect(commands.join("\n")).toContain('"JUNIOR"');
    expect(commands.join("\n")).toContain('"Junior"');
    expect(commands.join("\n")).toContain('"super_admin"');
    expect(commands.join("\n")).toContain('"super-admin"');
  });
});
