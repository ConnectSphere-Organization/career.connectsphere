import { describe, expect, it } from "vitest";

import { isRecommendableApplication } from "@/modules/collaboration/recommendation-policy";

const eligible = {
  applicantId: "applicant",
  applicantStatus: "ACTIVE" as const,
  applicationStatus: "PENDING" as const,
  recommenderId: "employee",
  recommendationId: undefined,
};

describe("recommendation policy", () => {
  it.each(["PENDING", "REVIEWING", "SHORTLISTED"] as const)(
    "allows %s applications",
    (applicationStatus) => {
      expect(
        isRecommendableApplication({ ...eligible, applicationStatus }),
      ).toBe(true);
    },
  );

  it.each(["OFFERED", "HIRED", "REJECTED"] as const)(
    "rejects %s applications",
    (applicationStatus) => {
      expect(
        isRecommendableApplication({ ...eligible, applicationStatus }),
      ).toBe(false);
    },
  );

  it("rejects self-recommendations", () => {
    expect(
      isRecommendableApplication({
        ...eligible,
        applicantId: eligible.recommenderId,
      }),
    ).toBe(false);
  });

  it("rejects inactive applicants and claimed applications", () => {
    expect(
      isRecommendableApplication({ ...eligible, applicantStatus: "INACTIVE" }),
    ).toBe(false);
    expect(
      isRecommendableApplication({ ...eligible, recommendationId: "existing" }),
    ).toBe(false);
  });
});
