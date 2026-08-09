import { describe, expect, it } from "vitest";

import { canManageJobDocument } from "@/modules/documents/document-scope";

describe("document job scope", () => {
  it("allows documents linked to an assigned job", () => {
    expect(
      canManageJobDocument({
        isAdministrator: false,
        assignedJobs: ["job-a"],
        jobId: "job-a",
      }),
    ).toBe(true);
  });

  it("denies documents linked to another job", () => {
    expect(
      canManageJobDocument({
        isAdministrator: false,
        assignedJobs: ["job-a"],
        jobId: "job-b",
      }),
    ).toBe(false);
  });

  it("denies legacy unlinked documents to non-administrators", () => {
    expect(
      canManageJobDocument({
        isAdministrator: false,
        assignedJobs: ["job-a"],
        jobId: null,
      }),
    ).toBe(false);
  });

  it("allows administrators to manage linked and legacy documents", () => {
    expect(
      canManageJobDocument({
        isAdministrator: true,
        assignedJobs: [],
        jobId: null,
      }),
    ).toBe(true);
    expect(
      canManageJobDocument({
        isAdministrator: true,
        assignedJobs: [],
        jobId: "job-b",
      }),
    ).toBe(true);
  });
});
