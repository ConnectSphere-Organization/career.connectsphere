import "server-only";

import type { Prisma } from "@prisma/client";

import { organizationCode } from "@/modules/people/organization-code";

export async function upsertEmployeeMaster(
  transaction: Prisma.TransactionClient,
  input: {
    userId: string;
    employeeCode: string;
    departmentName: string;
    designationName: string;
    positionLevel: "JUNIOR" | "SENIOR" | "LEAD" | "MANAGER" | "DIRECTOR";
    joinedAt: Date;
    employmentType?:
      "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | null;
  },
) {
  const departmentCode = organizationCode(input.departmentName, "GENERAL");
  const department = await transaction.department.upsert({
    where: { code: departmentCode },
    create: { code: departmentCode, name: input.departmentName || "General" },
    update: { name: input.departmentName || "General", isActive: true },
    select: { id: true },
  });
  const designationCode = organizationCode(
    `${departmentCode}_${input.designationName}`,
    `${departmentCode}_EMPLOYEE`,
  );
  const designation = await transaction.designation.upsert({
    where: { code: designationCode },
    create: {
      code: designationCode,
      name: input.designationName || "Employee",
      departmentId: department.id,
      level: input.positionLevel,
    },
    update: {
      name: input.designationName || "Employee",
      departmentId: department.id,
      level: input.positionLevel,
      isActive: true,
    },
    select: { id: true },
  });
  return transaction.employee.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      employeeCode: input.employeeCode,
      departmentId: department.id,
      designationId: designation.id,
      employmentStatus: "ACTIVE",
      employmentType: input.employmentType ?? null,
      joinedAt: input.joinedAt,
    },
    update: {
      employeeCode: input.employeeCode,
      departmentId: department.id,
      designationId: designation.id,
      employmentStatus: "ACTIVE",
      employmentType: input.employmentType ?? null,
      endedAt: null,
    },
    select: {
      id: true,
      employeeCode: true,
      departmentId: true,
      designationId: true,
      employmentStatus: true,
    },
  });
}
