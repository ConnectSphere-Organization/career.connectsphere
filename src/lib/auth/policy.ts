export type PermissionActor<Permission extends string> = {
  isAdministrator: boolean;
  permissions: Record<Permission, boolean>;
};

export type AssignmentActor = {
  isAdministrator: boolean;
  assignedJobs: readonly string[];
};

export const capabilityKeys = [
  "canGenerateCertificate",
  "canGenerateOfferLetter",
  "canCreateJob",
  "canManageJobs",
  "canViewApplicants",
  "canManageReviews",
  "canManageEmployees",
  "canManageRecommendations",
  "canManageCandidateCollaboration",
  "canManageCommunications",
  "canAccessDashboard",
  "canManageInterviews",
  "canManageAttendance",
  "canManageLeave",
  "canManagePayroll",
  "canManageExits",
  "canManageDocuments",
  "canVerifyDocuments",
  "canManagePrivacy",
  "canManageIntegrations",
  "canViewReports",
] as const;

export type Capability = (typeof capabilityKeys)[number];

const roleCapabilities: Record<string, readonly Capability[]> = {
  RECRUITER: [
    "canAccessDashboard",
    "canCreateJob",
    "canManageJobs",
    "canViewApplicants",
    "canGenerateOfferLetter",
    "canManageInterviews",
    "canManageRecommendations",
    "canManageCandidateCollaboration",
    "canManageCommunications",
  ],
  MANAGER: [
    "canAccessDashboard",
    "canViewApplicants",
    "canManageInterviews",
    "canManageCandidateCollaboration",
    "canManageLeave",
    "canViewReports",
  ],
  HR: [
    "canAccessDashboard",
    "canViewApplicants",
    "canManageInterviews",
    "canManageCandidateCollaboration",
    "canManageCommunications",
    "canManageEmployees",
    "canManageAttendance",
    "canManageLeave",
    "canManageExits",
    "canManageDocuments",
    "canManagePrivacy",
    "canViewReports",
  ],
  FINANCE: ["canAccessDashboard", "canManagePayroll", "canViewReports"],
  PAYROLL_ADMIN: [
    "canAccessDashboard",
    "canManagePayroll",
    "canManageDocuments",
    "canViewReports",
  ],
  VERIFIER: ["canAccessDashboard", "canVerifyDocuments"],
};

export function hasRoleCapability(
  role: string,
  capability: Capability,
): boolean {
  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    roleCapabilities[role]?.includes(capability) === true
  );
}

export function isRecruitmentRole(role: string): boolean {
  return ["ADMIN", "SUPER_ADMIN", "RECRUITER", "MANAGER", "HR"].includes(role);
}

export function hasHrIdentity(
  role: string,
  department: string | null,
): boolean {
  const normalizedDepartment = department?.trim().toLowerCase();
  return (
    role === "HR" ||
    (role === "EMPLOYEE" &&
      (normalizedDepartment === "hr" ||
        normalizedDepartment === "human resources"))
  );
}

export function hasStaffReferralAccess(role: string, status: string): boolean {
  return (
    status === "ACTIVE" &&
    [
      "EMPLOYEE",
      "ADMIN",
      "SUPER_ADMIN",
      "RECRUITER",
      "MANAGER",
      "HR",
      "FINANCE",
      "PAYROLL_ADMIN",
      "VERIFIER",
    ].includes(role)
  );
}

export function hasPermission<Permission extends string>(
  actor: PermissionActor<Permission>,
  permission: Permission,
): boolean {
  return actor.isAdministrator || actor.permissions[permission];
}

export function canAccessAssignedJob(
  actor: AssignmentActor,
  jobId: string,
): boolean {
  return actor.isAdministrator || actor.assignedJobs.includes(jobId);
}
