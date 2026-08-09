import { describe, expect, it } from "vitest";

import {
  canAccessAssignedJob,
  hasHrIdentity,
  hasPermission,
  hasStaffReferralAccess,
} from "@/lib/auth/policy";

describe("authorization policy", () => {
  it.each([
    ["EMPLOYEE", "HR", true],
    ["EMPLOYEE", " human resources ", true],
    ["EMPLOYEE", "Engineering", false],
    ["ADMIN", "HR", false],
    ["EMPLOYEE", null, false],
  ] as const)(
    "evaluates HR identity for %s in %s",
    (role, department, expected) => {
      expect(hasHrIdentity(role, department)).toBe(expected);
    },
  );

  it("allows administrators or explicitly granted permissions only", () => {
    expect(
      hasPermission(
        { isAdministrator: true, permissions: { canManageJobs: false } },
        "canManageJobs",
      ),
    ).toBe(true);
    expect(
      hasPermission(
        { isAdministrator: false, permissions: { canManageJobs: true } },
        "canManageJobs",
      ),
    ).toBe(true);
    expect(
      hasPermission(
        { isAdministrator: false, permissions: { canManageJobs: false } },
        "canManageJobs",
      ),
    ).toBe(false);
  });

  it("limits non-administrators to assigned jobs", () => {
    const limitedActor = {
      isAdministrator: false,
      assignedJobs: ["job-1", "job-2"],
    };
    expect(canAccessAssignedJob(limitedActor, "job-2")).toBe(true);
    expect(canAccessAssignedJob(limitedActor, "job-3")).toBe(false);
    expect(
      canAccessAssignedJob(
        { isAdministrator: true, assignedJobs: [] },
        "job-3",
      ),
    ).toBe(true);
  });

  it.each(["EMPLOYEE", "ADMIN", "SUPER_ADMIN"])(
    "allows active %s staff to submit referrals",
    (role) => {
      expect(hasStaffReferralAccess(role, "ACTIVE")).toBe(true);
    },
  );

  it("denies candidates and inactive staff from submitting referrals", () => {
    expect(hasStaffReferralAccess("USER", "ACTIVE")).toBe(false);
    expect(hasStaffReferralAccess("EMPLOYEE", "INACTIVE")).toBe(false);
    expect(hasStaffReferralAccess("ADMIN", "SUSPENDED")).toBe(false);
    expect(hasStaffReferralAccess("EMPLOYEE", "FORMER")).toBe(false);
  });
});
