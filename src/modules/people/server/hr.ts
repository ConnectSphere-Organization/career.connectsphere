import "server-only";

import { recordAudit } from "@/lib/audit/audit";
import type { CollaborationActor } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import {
  hrGrantSchema,
  hrUpdateSchema,
  permissionKeys,
} from "@/modules/people/schema";
import { employeeIdForUser } from "@/modules/recruitment/applications/employee-promotion";

const hrWhere = {
  OR: [
    { role: "HR" as const },
    {
      role: "EMPLOYEE" as const,
      department: {
        in: ["HR", "Human Resources"],
        mode: "insensitive" as const,
      },
    },
  ],
};

export async function listHrManagement() {
  const [hrs, jobs, candidates] = await Promise.all([
    prisma.user.findMany({
      where: hrWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        assignedJobs: true,
        permissions: true,
      },
    }),
    prisma.job.findMany({
      where: { isActive: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true, company: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["USER", "EMPLOYEE"] }, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: 100,
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);
  return { hrs, jobs, candidates };
}

async function validateJobs(jobIds: readonly string[]): Promise<void> {
  const count = await prisma.job.count({
    where: { id: { in: [...new Set(jobIds)] }, isActive: true },
  });
  if (count !== new Set(jobIds).size)
    throw new ApiError(
      "One or more assigned jobs are invalid or inactive",
      400,
    );
}

export async function grantHr(raw: unknown, actor: CollaborationActor) {
  const input = hrGrantSchema.parse(raw);
  await validateJobs(input.assignedJobs);
  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true, employeeId: true, position: true },
  });
  if (!target) throw new ApiError("User not found", 404);
  if (target.role === "ADMIN" || target.role === "SUPER_ADMIN")
    throw new ApiError("Administrator accounts cannot be converted to HR", 409);
  const hr = await prisma.user.update({
    where: { id: input.userId },
    data: {
      role: "HR",
      department: "HR",
      status: "ACTIVE",
      employeeId: target.employeeId ?? employeeIdForUser(target.id),
      position: target.position ?? "HR Executive",
      permissions: input.permissions,
      assignedJobs: input.assignedJobs,
    },
    select: {
      id: true,
      name: true,
      email: true,
      permissions: true,
      assignedJobs: true,
    },
  });
  await recordAudit({
    actor,
    action: "ASSIGN",
    resourceEntity: "User",
    resourceId: input.userId,
    changes: {
      permissionKeys: permissionKeys.filter((key) => input.permissions[key]),
      assignedJobCount: input.assignedJobs.length,
    },
  });
  return hr;
}

export async function updateHr(
  hrId: string,
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = hrUpdateSchema.parse(raw);
  await validateJobs(input.assignedJobs);
  const result = await prisma.user.updateMany({
    where: { id: hrId, ...hrWhere },
    data: { permissions: input.permissions, assignedJobs: input.assignedJobs },
  });
  if (result.count !== 1) throw new ApiError("HR user not found", 404);
  await recordAudit({
    actor,
    action: "UPDATE_PERMISSIONS",
    resourceEntity: "User",
    resourceId: hrId,
    changes: {
      permissionKeys: permissionKeys.filter((key) => input.permissions[key]),
      assignedJobCount: input.assignedJobs.length,
    },
  });
}

export async function revokeHr(hrId: string, actor: CollaborationActor) {
  const result = await prisma.user.updateMany({
    where: { id: hrId, ...hrWhere },
    data: {
      role: "EMPLOYEE",
      department: null,
      permissions: Object.fromEntries(
        permissionKeys.map((key) => [key, false]),
      ),
      assignedJobs: [],
    },
  });
  if (result.count !== 1) throw new ApiError("HR user not found", 404);
  await prisma.session.deleteMany({ where: { userId: hrId } });
  await recordAudit({
    actor,
    action: "REVOKE",
    resourceEntity: "User",
    resourceId: hrId,
    changes: { assignedJobCount: 0, permissionKeys: [] },
  });
}
