import { ApplicationStatus } from "@prisma/client";

const transitions: Readonly<
  Record<ApplicationStatus, readonly ApplicationStatus[]>
> = {
  PENDING: [ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED],
  REVIEWING: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
  SHORTLISTED: [ApplicationStatus.OFFERED, ApplicationStatus.REJECTED],
  OFFERED: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED],
  HIRED: [],
  REJECTED: [],
};

export function allowedStatusTransitions(
  status: ApplicationStatus,
): readonly ApplicationStatus[] {
  return transitions[status];
}

export function canTransitionApplicationStatus(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return allowedStatusTransitions(from).includes(to);
}
