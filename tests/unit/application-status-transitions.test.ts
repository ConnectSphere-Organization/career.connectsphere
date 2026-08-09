import { ApplicationStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  allowedStatusTransitions,
  canTransitionApplicationStatus,
} from "@/modules/recruitment/applications/status-transitions";

describe("application status transitions", () => {
  it.each([
    [
      ApplicationStatus.PENDING,
      [ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED],
    ],
    [
      ApplicationStatus.REVIEWING,
      [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
    ],
    [
      ApplicationStatus.SHORTLISTED,
      [ApplicationStatus.OFFERED, ApplicationStatus.REJECTED],
    ],
    [
      ApplicationStatus.OFFERED,
      [ApplicationStatus.HIRED, ApplicationStatus.REJECTED],
    ],
    [ApplicationStatus.HIRED, []],
    [ApplicationStatus.REJECTED, []],
  ])("exposes legal transitions from %s", (status, expected) => {
    expect(allowedStatusTransitions(status)).toEqual(expected);
  });

  it("rejects skipping, reversing, repeated, and terminal transitions", () => {
    expect(
      canTransitionApplicationStatus(
        ApplicationStatus.PENDING,
        ApplicationStatus.HIRED,
      ),
    ).toBe(false);
    expect(
      canTransitionApplicationStatus(
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REVIEWING,
      ),
    ).toBe(false);
    expect(
      canTransitionApplicationStatus(
        ApplicationStatus.REVIEWING,
        ApplicationStatus.REVIEWING,
      ),
    ).toBe(false);
    expect(
      canTransitionApplicationStatus(
        ApplicationStatus.REJECTED,
        ApplicationStatus.PENDING,
      ),
    ).toBe(false);
  });
});
