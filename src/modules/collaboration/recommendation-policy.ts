import type { ApplicationStatus, UserStatus } from "@prisma/client";

export const recommendableApplicationStatuses = [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
] as const satisfies readonly ApplicationStatus[];

export function isRecommendableApplication({
  applicantId,
  applicantStatus,
  applicationStatus,
  recommenderId,
  recommendationId,
}: {
  applicantId: string | null;
  applicantStatus: UserStatus | null;
  applicationStatus: ApplicationStatus;
  recommenderId: string;
  recommendationId: string | null | undefined;
}): boolean {
  return Boolean(
    applicantId &&
    applicantId !== recommenderId &&
    applicantStatus === "ACTIVE" &&
    recommendableApplicationStatuses.includes(
      applicationStatus as (typeof recommendableApplicationStatuses)[number],
    ) &&
    !recommendationId,
  );
}
