import type { RecommendationStatus } from "@prisma/client";

export const referralTransitions: Record<
  RecommendationStatus,
  readonly RecommendationStatus[]
> = {
  PENDING: ["REVIEWED", "SELECTED", "REJECTED"],
  REVIEWED: ["SELECTED", "REJECTED"],
  SELECTED: [],
  REJECTED: [],
};

export function canTransitionReferral(
  from: RecommendationStatus,
  to: RecommendationStatus,
): boolean {
  return referralTransitions[from].includes(to);
}
