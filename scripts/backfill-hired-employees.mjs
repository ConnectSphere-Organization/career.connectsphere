import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

function employeeRoleAfterHire(role) {
  return role === "USER" ? "EMPLOYEE" : role;
}

function employeeIdForUser(userId) {
  const normalized = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `EMP${normalized.padStart(8, "0")}`;
}

function employmentProfileAfterHire(offer, job) {
  return {
    position: offer?.position || job.position || job.title,
    department: offer?.department || job.department || "General",
    reportingManager: offer?.reportingManager || job.reportingManager || null,
  };
}

async function findUser(application) {
  if (application.userId) {
    const linked = await prisma.user.findUnique({
      where: { id: application.userId },
    });
    if (linked) return linked;
  }
  return prisma.user.findFirst({
    where: { email: { equals: application.email, mode: "insensitive" } },
  });
}

async function main() {
  const applications = await prisma.application.findMany({
    where: { status: "HIRED" },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      slug: true,
      userId: true,
      email: true,
      job: {
        select: {
          title: true,
          position: true,
          department: true,
          reportingManager: true,
        },
      },
      offers: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { position: true, department: true, reportingManager: true },
      },
    },
  });

  const plansByUser = new Map();
  const unmatched = [];

  for (const application of applications) {
    const user = await findUser(application);
    if (!user) {
      unmatched.push({
        applicationId: application.id,
        slug: application.slug,
        email: application.email,
      });
      continue;
    }

    const profile = employmentProfileAfterHire(
      application.offers[0],
      application.job,
    );
    const changes = {
      role: employeeRoleAfterHire(user.role),
      status: "ACTIVE",
      employeeId: user.employeeId || employeeIdForUser(user.id),
      position: profile.position,
      department: profile.department,
      reportingManager: profile.reportingManager,
    };
    const changedFields = Object.entries(changes)
      .filter(([key, value]) => user[key] !== value)
      .map(([key]) => key);

    const existing = plansByUser.get(user.id);
    if (!existing) {
      plansByUser.set(user.id, {
        userId: user.id,
        email: user.email,
        applicationIds: [application.id],
        applicationLinks:
          application.userId === user.id ? [] : [application.id],
        changes,
        changedFields,
      });
    } else {
      existing.applicationIds.push(application.id);
      if (application.userId !== user.id)
        existing.applicationLinks.push(application.id);
    }
  }

  const plans = [...plansByUser.values()];
  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        hiredApplications: applications.length,
        matchedUsers: plans.length,
        usersNeedingUpdates: plans.filter(
          (plan) => plan.changedFields.length > 0,
        ).length,
        applicationsNeedingLinks: plans.reduce(
          (total, plan) => total + plan.applicationLinks.length,
          0,
        ),
        unmatched,
        plans,
      },
      null,
      2,
    ),
  );

  if (!apply) return;

  let updatedUsers = 0;
  let linkedApplications = 0;
  for (const plan of plans) {
    await prisma.$transaction(async (transaction) => {
      if (plan.changedFields.length > 0) {
        await transaction.user.update({
          where: { id: plan.userId },
          data: plan.changes,
        });
        updatedUsers += 1;
      }
      if (plan.applicationLinks.length > 0) {
        const linked = await transaction.application.updateMany({
          where: { id: { in: plan.applicationLinks }, status: "HIRED" },
          data: { userId: plan.userId },
        });
        linkedApplications += linked.count;
      }
    });
  }

  console.log(
    JSON.stringify({
      updatedUsers,
      linkedApplications,
      unmatched: unmatched.length,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
