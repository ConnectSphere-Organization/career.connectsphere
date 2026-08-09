import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

function code(value, fallback) {
  return (
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || fallback
  );
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"] },
      employeeId: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      employeeId: true,
      department: true,
      position: true,
      positionLevel: true,
      status: true,
      createdAt: true,
      employeeRecord: { select: { id: true } },
    },
  });
  const plans = users
    .filter((user) => !user.employeeRecord)
    .map((user) => ({
      userId: user.id,
      employeeCode: user.employeeId,
      departmentName: user.department || "General",
      designationName: user.position || "Employee",
      positionLevel: user.positionLevel,
      joinedAt: user.createdAt,
      employmentStatus:
        user.status === "FORMER"
          ? "EXITED"
          : user.status === "ACTIVE"
            ? "ACTIVE"
            : "NOTICE",
    }));
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        staffUsers: users.length,
        employeeRecordsToCreate: plans.length,
        plans,
      },
      null,
      2,
    ),
  );
  if (!apply) return;
  for (const plan of plans) {
    const departmentCode = code(plan.departmentName, "GENERAL");
    const department = await prisma.department.upsert({
      where: { code: departmentCode },
      create: { code: departmentCode, name: plan.departmentName },
      update: { name: plan.departmentName, isActive: true },
    });
    const designationCode = code(
      `${departmentCode}_${plan.designationName}`,
      `${departmentCode}_EMPLOYEE`,
    );
    const designation = await prisma.designation.upsert({
      where: { code: designationCode },
      create: {
        code: designationCode,
        name: plan.designationName,
        departmentId: department.id,
        level: plan.positionLevel,
      },
      update: {
        name: plan.designationName,
        departmentId: department.id,
        level: plan.positionLevel,
        isActive: true,
      },
    });
    await prisma.employee.upsert({
      where: { userId: plan.userId },
      create: {
        userId: plan.userId,
        employeeCode: plan.employeeCode,
        departmentId: department.id,
        designationId: designation.id,
        employmentStatus: plan.employmentStatus,
        joinedAt: plan.joinedAt,
      },
      update: {},
    });
  }
  console.log(JSON.stringify({ created: plans.length }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
