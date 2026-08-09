import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { env } from "@/config/env";
import { auth, type AuthSession } from "@/lib/auth/auth";
import {
  isActiveAccountStatus,
  isEnabledAccountStatus,
} from "@/lib/auth/account-status";
import {
  canAccessAssignedJob,
  capabilityKeys,
  type Capability,
  hasHrIdentity,
  hasPermission,
  hasRoleCapability,
  hasStaffReferralAccess,
  isRecruitmentRole,
} from "@/lib/auth/policy";
import { prisma } from "@/lib/db/prisma";

export const recruitmentPermissions = [
  "canCreateJob",
  "canManageJobs",
  "canViewApplicants",
  "canAccessDashboard",
  "canGenerateCertificate",
  "canGenerateOfferLetter",
  "canManageInterviews",
  "canManageCandidateCollaboration",
] as const;

export const collaborationPermissions = capabilityKeys;

export type RecruitmentPermission = (typeof recruitmentPermissions)[number];
export type CollaborationPermission = Capability;

export type RecruitmentActor = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  assignedJobs: readonly string[];
  permissions: Record<RecruitmentPermission, boolean>;
  isAdministrator: boolean;
  twoFactorEnabled: boolean;
};

const privilegedRoles: UserRole[] = [
  "ADMIN",
  "SUPER_ADMIN",
  "RECRUITER",
  "MANAGER",
  "FINANCE",
  "HR",
  "VERIFIER",
  "PAYROLL_ADMIN",
];

function mfaEnrollmentRequired(actor: {
  role: UserRole;
  twoFactorEnabled: boolean;
}): boolean {
  return (
    env.REQUIRE_PRIVILEGED_MFA &&
    privilegedRoles.includes(actor.role) &&
    !actor.twoFactorEnabled
  );
}

function effectivePermission(
  role: UserRole,
  permissions: Partial<Record<Capability, boolean>> | null | undefined,
  capability: Capability,
): boolean {
  return (
    hasRoleCapability(role, capability) || permissions?.[capability] === true
  );
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 = 403,
  ) {
    super(message);
  }
}

export async function getSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!isEnabledAccountStatus(session.user.status)) {
    redirect("/login?message=Account%20is%20not%20active");
  }

  return session;
}

export async function requireRole(
  roles: readonly string[],
): Promise<AuthSession> {
  const session = await requireUser();
  const role = (session.user.role ?? "USER").toUpperCase();
  if (!roles.map((allowedRole) => allowedRole.toUpperCase()).includes(role)) {
    redirect("/");
  }
  return session;
}

export async function getRecruitmentActor(): Promise<RecruitmentActor | null> {
  const session = await getSession();
  if (!session || !isActiveAccountStatus(session.user.status)) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      assignedJobs: true,
      permissions: true,
      twoFactorEnabled: true,
    },
  });
  if (!user || user.status !== "ACTIVE") return null;

  const isAdministrator = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (
    !isAdministrator &&
    !isRecruitmentRole(user.role) &&
    !hasHrIdentity(user.role, user.department)
  )
    return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    assignedJobs: user.assignedJobs,
    permissions: {
      canCreateJob: effectivePermission(
        user.role,
        user.permissions,
        "canCreateJob",
      ),
      canManageJobs: effectivePermission(
        user.role,
        user.permissions,
        "canManageJobs",
      ),
      canViewApplicants: effectivePermission(
        user.role,
        user.permissions,
        "canViewApplicants",
      ),
      canAccessDashboard: effectivePermission(
        user.role,
        user.permissions,
        "canAccessDashboard",
      ),
      canGenerateCertificate: effectivePermission(
        user.role,
        user.permissions,
        "canGenerateCertificate",
      ),
      canGenerateOfferLetter: effectivePermission(
        user.role,
        user.permissions,
        "canGenerateOfferLetter",
      ),
      canManageInterviews: effectivePermission(
        user.role,
        user.permissions,
        "canManageInterviews",
      ),
      canManageCandidateCollaboration: effectivePermission(
        user.role,
        user.permissions,
        "canManageCandidateCollaboration",
      ),
    },
    isAdministrator,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

export async function requireRecruitmentActor(): Promise<RecruitmentActor> {
  const actor = await getRecruitmentActor();
  if (!actor) redirect("/login");
  if (mfaEnrollmentRequired(actor)) redirect("/security?required=1");
  return actor;
}

export async function authorizeRecruitment(
  permission: RecruitmentPermission,
): Promise<RecruitmentActor> {
  const actor = await getRecruitmentActor();
  if (!actor) throw new AuthorizationError("Authentication required", 401);
  if (mfaEnrollmentRequired(actor))
    throw new AuthorizationError(
      "Multi-factor authentication enrollment is required",
    );
  if (!hasPermission(actor, permission)) {
    throw new AuthorizationError(`Permission required: ${permission}`);
  }
  return actor;
}

export async function requireRecruitment(
  permission: RecruitmentPermission,
): Promise<RecruitmentActor> {
  try {
    return await authorizeRecruitment(permission);
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401)
      redirect("/login");
    redirect("/");
  }
}

export function assertAssignedJob(
  actor: RecruitmentActor,
  jobId: string,
): void {
  if (!canAccessAssignedJob(actor, jobId)) {
    throw new AuthorizationError(
      "Access denied: this job is outside your assignment scope",
    );
  }
}

export type CollaborationActor = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "FORMER" | "SUSPENDED";
  department: string | null;
  employeeId: string | null;
  assignedJobs: readonly string[];
  permissions: Record<CollaborationPermission, boolean>;
  isAdministrator: boolean;
  isSuperAdmin: boolean;
  twoFactorEnabled: boolean;
};

export async function getCollaborationActor(): Promise<CollaborationActor | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      employeeId: true,
      assignedJobs: true,
      permissions: true,
      twoFactorEnabled: true,
    },
  });
  if (!user || user.status === "INACTIVE" || user.status === "SUSPENDED")
    return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department,
    employeeId: user.employeeId,
    assignedJobs: user.assignedJobs,
    permissions: {
      ...(Object.fromEntries(
        capabilityKeys.map((capability) => [
          capability,
          effectivePermission(user.role, user.permissions, capability),
        ]),
      ) as Record<CollaborationPermission, boolean>),
    },
    isAdministrator: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
    isSuperAdmin: user.role === "SUPER_ADMIN",
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

export async function authorizeCollaboration(
  permission: CollaborationPermission,
): Promise<CollaborationActor> {
  const actor = await getCollaborationActor();
  if (!actor) throw new AuthorizationError("Authentication required", 401);
  if (mfaEnrollmentRequired(actor))
    throw new AuthorizationError(
      "Multi-factor authentication enrollment is required",
    );
  if (!hasPermission(actor, permission)) {
    throw new AuthorizationError(`Permission required: ${permission}`);
  }
  return actor;
}

export async function authorizeCollaborationActor(): Promise<CollaborationActor> {
  const actor = await getCollaborationActor();
  if (!actor) throw new AuthorizationError("Authentication required", 401);
  return actor;
}

export async function authorizeSuperAdmin(): Promise<CollaborationActor> {
  const actor = await getCollaborationActor();
  if (!actor) throw new AuthorizationError("Authentication required", 401);
  if (mfaEnrollmentRequired(actor))
    throw new AuthorizationError(
      "Multi-factor authentication enrollment is required",
    );
  if (!actor.isSuperAdmin)
    throw new AuthorizationError("Super-admin access required");
  return actor;
}

export async function authorizeEmployee(
  options: { allowFormer?: boolean } = {},
): Promise<CollaborationActor> {
  const actor = await getCollaborationActor();
  if (!actor) throw new AuthorizationError("Authentication required", 401);
  const eligibleStatus =
    actor.status === "ACTIVE" ||
    (options.allowFormer === true && actor.status === "FORMER");
  if (actor.role !== "EMPLOYEE" || !eligibleStatus) {
    throw new AuthorizationError("Employee access required");
  }
  return actor;
}

export async function authorizeStaffReferrer(): Promise<CollaborationActor> {
  const actor = await getCollaborationActor();
  if (!actor) throw new AuthorizationError("Authentication required", 401);
  if (!hasStaffReferralAccess(actor.role, actor.status))
    throw new AuthorizationError("Active staff access required");
  return actor;
}

export async function requireCollaboration(
  permission: CollaborationPermission,
): Promise<CollaborationActor> {
  try {
    return await authorizeCollaboration(permission);
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401)
      redirect("/login");
    redirect("/");
  }
}

export async function requireCollaborationActor(): Promise<CollaborationActor> {
  try {
    const actor = await authorizeCollaborationActor();
    if (mfaEnrollmentRequired(actor)) redirect("/security?required=1");
    return actor;
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401)
      redirect("/login");
    redirect("/");
  }
}

export async function requireSuperAdmin(): Promise<CollaborationActor> {
  try {
    const actor = await getCollaborationActor();
    if (!actor) redirect("/login");
    if (mfaEnrollmentRequired(actor)) redirect("/security?required=1");
    if (!actor.isSuperAdmin) redirect("/");
    return actor;
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401)
      redirect("/login");
    redirect("/");
  }
}

export async function requireEmployee(
  options: { allowFormer?: boolean } = {},
): Promise<CollaborationActor> {
  try {
    return await authorizeEmployee(options);
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401)
      redirect("/login");
    redirect("/");
  }
}

export async function requireStaffReferrer(): Promise<CollaborationActor> {
  try {
    return await authorizeStaffReferrer();
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401)
      redirect("/login");
    redirect("/");
  }
}
