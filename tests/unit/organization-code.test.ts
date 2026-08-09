import { describe, expect, it } from "vitest";

import { organizationCode } from "@/modules/people/organization-code";

describe("organization code", () => {
  it("normalizes organization names deterministically", () => {
    expect(organizationCode(" Human Resources ", "GENERAL")).toBe(
      "HUMAN_RESOURCES",
    );
    expect(organizationCode("UI/UX Designer", "EMPLOYEE")).toBe(
      "UI_UX_DESIGNER",
    );
  });

  it("uses a fallback for empty names", () => {
    expect(organizationCode("---", "GENERAL")).toBe("GENERAL");
  });
});
