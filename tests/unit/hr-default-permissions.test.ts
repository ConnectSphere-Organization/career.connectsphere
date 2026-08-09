import { describe, expect, it } from "vitest";

import { defaultHrPermissions } from "@/modules/people/schema";

describe("HR default permissions", () => {
  it("enables recruitment work immediately", () => {
    expect(defaultHrPermissions).toMatchObject({
      canAccessDashboard: true,
      canManageJobs: true,
      canCreateJob: true,
      canViewApplicants: true,
      canGenerateOfferLetter: true,
      canGenerateCertificate: true,
      canManageRecommendations: true,
    });
  });

  it("keeps employee administration opt-in", () => {
    expect(defaultHrPermissions.canManageEmployees).toBe(false);
  });
});
