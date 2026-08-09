import type { RecruitmentActor } from "@/lib/auth/authorization";

export function recruitmentHome(
  actor: Pick<RecruitmentActor, "isAdministrator" | "permissions">,
): string | null {
  if (actor.isAdministrator || actor.permissions.canAccessDashboard)
    return "/recruitment";
  if (actor.permissions.canViewApplicants) return "/recruitment/applications";
  if (actor.permissions.canManageJobs || actor.permissions.canCreateJob)
    return "/recruitment/jobs";
  if (actor.permissions.canGenerateOfferLetter) return "/recruitment/offers";
  if (actor.permissions.canGenerateCertificate)
    return "/recruitment/certificates";
  return null;
}
