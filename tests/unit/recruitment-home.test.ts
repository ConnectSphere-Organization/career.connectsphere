import { describe, expect, it } from "vitest";

import { recruitmentHome } from "@/lib/auth/recruitment-home";

const permissions = {
  canCreateJob: false,
  canManageJobs: false,
  canViewApplicants: false,
  canManageCandidateCollaboration: false,
  canAccessDashboard: false,
  canGenerateCertificate: false,
  canGenerateOfferLetter: false,
  canManageInterviews: false,
};

describe("recruitment home", () => {
  it("uses the dashboard for administrators", () => {
    expect(recruitmentHome({ isAdministrator: true, permissions })).toBe(
      "/recruitment",
    );
  });

  it("uses the first permitted work page when dashboard access is disabled", () => {
    expect(
      recruitmentHome({
        isAdministrator: false,
        permissions: {
          ...permissions,
          canViewApplicants: true,
          canGenerateCertificate: true,
        },
      }),
    ).toBe("/recruitment/applications");
    expect(
      recruitmentHome({
        isAdministrator: false,
        permissions: { ...permissions, canGenerateCertificate: true },
      }),
    ).toBe("/recruitment/certificates");
  });

  it("returns no workspace when no recruitment permission is enabled", () => {
    expect(recruitmentHome({ isAdministrator: false, permissions })).toBeNull();
  });
});
