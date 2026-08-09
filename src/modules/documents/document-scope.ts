export function canManageJobDocument({
  assignedJobs,
  isAdministrator,
  jobId,
}: {
  assignedJobs: readonly string[];
  isAdministrator: boolean;
  jobId: string | null | undefined;
}): boolean {
  return isAdministrator || Boolean(jobId && assignedJobs.includes(jobId));
}
