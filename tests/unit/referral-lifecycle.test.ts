import { describe, expect, it } from "vitest";

import { canTransitionReferral } from "@/modules/collaboration/referral-lifecycle";

describe("referral lifecycle", () => {
  it("allows review or a final decision from pending", () => {
    expect(canTransitionReferral("PENDING", "REVIEWED")).toBe(true);
    expect(canTransitionReferral("PENDING", "SELECTED")).toBe(true);
    expect(canTransitionReferral("PENDING", "REJECTED")).toBe(true);
  });

  it("allows final decisions after review", () => {
    expect(canTransitionReferral("REVIEWED", "SELECTED")).toBe(true);
    expect(canTransitionReferral("REVIEWED", "REJECTED")).toBe(true);
  });

  it("keeps final decisions immutable", () => {
    expect(canTransitionReferral("SELECTED", "REJECTED")).toBe(false);
    expect(canTransitionReferral("REJECTED", "SELECTED")).toBe(false);
  });
});
