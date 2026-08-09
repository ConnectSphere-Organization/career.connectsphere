import "server-only";

import type { Prisma } from "@prisma/client";

import { recordAudit } from "@/lib/audit/audit";
import type { CollaborationActor } from "@/lib/auth/authorization";
import { auth } from "@/lib/auth/auth";
import { csvRecords, parseCsv, stringifyCsv } from "@/lib/csv";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import {
  bulkPeopleActionSchema,
  employeeImportRowSchema,
  lifecycleSchema,
  peopleQuerySchema,
  type PeopleQuery,
} from "@/modules/people/schema";

function peopleWhere(query: PeopleQuery): Prisma.UserWhereInput {
  const viewRole: Prisma.EnumUserRoleFilter =
    query.view === "users"
      ? { equals: "USER" }
      : {
        in: [
          "EMPLOYEE",
          "ADMIN",
          "SUPER_ADMIN",
          "RECRUITER",
          "MANAGER",
          "FINANCE",
          "HR",
          "VERIFIER",
          "PAYROLL_ADMIN",
        ],
      };
  return {
    role: query.role ? { equals: query.role } : viewRole,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
        OR: ["name", "email", "employeeId", "department", "position"].map(
          (field) => ({
            [field]: { contains: query.search, mode: "insensitive" },
          }),
        ),
      }
      : {}),
  };
}

export async function listPeople(raw: unknown) {
  const query = peopleQuerySchema.parse(raw);
  const where = peopleWhere(query);
  const [people, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        department: true,
        position: true,
        positionLevel: true,
        employeeId: true,
        terminatedAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  return {
    people,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function updatePerson(
  userId: string,
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = lifecycleSchema.parse(raw);
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!existing) throw new ApiError("User not found", 404);
  if (input.operation === "role" && !actor.isSuperAdmin)
    throw new ApiError("Super-admin access required", 403);
  if (
    actor.id === userId &&
    (input.operation === "role" ||
      (input.operation === "profile" && input.status !== "ACTIVE"))
  ) {
    throw new ApiError("Self-demotion or self-lockout is not allowed", 409);
  }
  if (
    existing.role === "SUPER_ADMIN" &&
    ((input.operation === "role" && input.role !== "SUPER_ADMIN") ||
      input.operation === "terminate")
  ) {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN", status: "ACTIVE" },
    });
    if (superAdminCount <= 1)
      throw new ApiError("The last active super-admin cannot be changed", 409);
  }
  const data: Prisma.UserUpdateInput =
    input.operation === "profile"
      ? {
        status: input.status,
        department: input.department,
        position: input.position,
        positionLevel: input.positionLevel,
        ...(input.status !== "FORMER"
          ? { terminatedAt: null, terminationReason: null }
          : {}),
      }
      : input.operation === "terminate"
        ? {
          status: "FORMER",
          terminatedAt: new Date(),
          terminationReason: input.reason,
        }
        : { role: input.role };
  const person = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      position: true,
      positionLevel: true,
      terminatedAt: true,
    },
  });
  await prisma.session.deleteMany({ where: { userId } });
  await recordAudit({
    actor,
    action: input.operation === "role" ? "UPDATE" : "STATUS_CHANGE",
    resourceEntity: "User",
    resourceId: userId,
    changes: {
      oldStatus: existing.status,
      newStatus: person.status,
      oldRole: existing.role,
      newRole: person.role,
      reasonProvided: input.operation === "terminate",
    },
  });
  return person;
}

export async function deletePerson(userId: string, actor: CollaborationActor) {
  if (actor.id === userId)
    throw new ApiError("You cannot delete your own account", 409);
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!existing) throw new ApiError("User not found", 404);
  if (existing.role === "SUPER_ADMIN") {
    const count = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (count <= 1)
      throw new ApiError("The last super-admin cannot be deleted", 409);
  }
  const dependencies = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      _count: {
        select: {
          applications: true,
          reviews: true,
          recommendationsMade: true,
          recommendationsReceived: true,
        },
      },
    },
  });
  if (
    dependencies &&
    Object.values(dependencies._count).some((count) => count > 0)
  )
    throw new ApiError(
      "Account has retained business records; suspend it instead",
      409,
    );
  await prisma.user.delete({ where: { id: userId } });
  await recordAudit({
    actor,
    action: "DELETE",
    resourceEntity: "User",
    resourceId: userId,
  });
}

export async function bulkPeopleAction(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = bulkPeopleActionSchema.parse(raw);
  if (
    input.userIds.includes(actor.id) &&
    input.operation === "status" &&
    input.status !== "ACTIVE"
  )
    throw new ApiError("Bulk action cannot lock your own account", 409);
  const people = await prisma.user.findMany({
    where: { id: { in: input.userIds } },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  if (people.length !== new Set(input.userIds).size)
    throw new ApiError("One or more accounts were not found", 404);
  const lastActiveSuperAdmin =
    input.operation === "status" &&
    input.status !== "ACTIVE" &&
    people.some((person) => person.role === "SUPER_ADMIN") &&
    (await prisma.user.count({
      where: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        id: { notIn: input.userIds },
      },
    })) === 0;
  if (lastActiveSuperAdmin)
    throw new ApiError("The last active super-admin cannot be changed", 409);

  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    await transaction.user.updateMany({
      where: { id: { in: input.userIds } },
      data: {
        status: input.status,
        ...(input.status === "FORMER"
          ? { terminatedAt: now, terminationReason: "Bulk status action" }
          : { terminatedAt: null, terminationReason: null }),
      },
    });
    await transaction.session.deleteMany({
      where: { userId: { in: input.userIds } },
    });
    for (const person of people)
      await transaction.auditLog.create({
        data: {
          actor: actor.id,
          actorRole: actor.role,
          action: "STATUS_CHANGE",
          resourceEntity: "User",
          resourceId: person.id,
          changes: {
            operation: "bulk",
            oldStatus: person.status,
            newStatus: input.status,
          },
        },
      });
  });
  return { total: people.length, succeeded: people.length, failed: 0 };
}

export const employeeCsvHeaders = [
  "name",
  "email",
  "employeeId",
  "department",
  "position",
  "positionLevel",
  "reportingManager",
  "phoneNumber",
] as const;

export function employeeSampleCsv(): string {
  return stringifyCsv([
    employeeCsvHeaders,
    [
      "Sample Employee",
      "employee@example.com",
      "EMP-001",
      "Engineering",
      "Software Engineer",
      "JUNIOR",
      "Engineering Manager",
      "+91 9000000000",
    ],
  ]);
}

type EmployeeImportResult = {
  row: number;
  success: boolean;
  id?: string;
  email?: string;
  error?: string;
};

export async function importEmployees(
  csv: string,
  actor: CollaborationActor,
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: EmployeeImportResult[];
}> {
  if (!actor.isSuperAdmin && !actor.permissions.canManageEmployees)
    throw new ApiError("Employee management permission required", 403);
  const records = csvRecords(parseCsv(csv), employeeCsvHeaders);
  if (records.length === 0)
    throw new ApiError("CSV contains no data rows", 400);
  const results: EmployeeImportResult[] = [];
  for (let index = 0; index < records.length; index += 1) {
    const row = index + 2;
    try {
      const input = employeeImportRowSchema.parse(records[index]);
      const duplicate = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { employeeId: input.employeeId }],
        },
        select: { id: true },
      });
      if (duplicate)
        throw new ApiError("Email or employee ID already exists", 409);
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          employeeId: input.employeeId,
          department: input.department,
          position: input.position,
          positionLevel: input.positionLevel,
          reportingManager: input.reportingManager || null,
          phoneNumber: input.phoneNumber || null,
          role: "EMPLOYEE",
          status: "ACTIVE",
          isEmailVerified: true,
          assignedJobs: [],
        },
        select: { id: true, email: true },
      });
      try {
        await auth.api.requestPasswordReset({
          body: { email: user.email, redirectTo: "/reset-password" },
        });
      } catch (error) {
        await prisma.user.delete({ where: { id: user.id } });
        throw error;
      }
      await recordAudit({
        actor,
        action: "CREATE",
        resourceEntity: "User",
        resourceId: user.id,
        changes: {
          operation: "bulk-employee-import",
          role: "EMPLOYEE",
          onboarding: "reset-link",
        },
      });
      results.push({ row, success: true, id: user.id, email: user.email });
    } catch (error) {
      results.push({
        row,
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to import employee",
      });
    }
  }
  const succeeded = results.filter((result) => result.success).length;
  return {
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  };
}
