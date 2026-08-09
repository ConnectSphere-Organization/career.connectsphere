import "server-only";

import type { Prisma } from "@prisma/client";

import type { RecruitmentActor } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export async function getRecruitmentDashboard(actor: RecruitmentActor) {
  const applicationWhere: Prisma.ApplicationWhereInput = actor.isAdministrator
    ? {}
    : { jobId: { in: [...actor.assignedJobs] } };
  const jobWhere: Prisma.JobWhereInput = actor.isAdministrator
    ? {}
    : { id: { in: [...actor.assignedJobs] } };

  const [
    total,
    pending,
    reviewing,
    shortlisted,
    offered,
    hired,
    rejected,
    activeJobs,
    recent,
  ] = await Promise.all([
    prisma.application.count({ where: applicationWhere }),
    prisma.application.count({
      where: { ...applicationWhere, status: "PENDING" },
    }),
    prisma.application.count({
      where: { ...applicationWhere, status: "REVIEWING" },
    }),
    prisma.application.count({
      where: { ...applicationWhere, status: "SHORTLISTED" },
    }),
    prisma.application.count({
      where: { ...applicationWhere, status: "OFFERED" },
    }),
    prisma.application.count({
      where: { ...applicationWhere, status: "HIRED" },
    }),
    prisma.application.count({
      where: { ...applicationWhere, status: "REJECTED" },
    }),
    prisma.job.count({ where: { ...jobWhere, isActive: true } }),
    prisma.application.findMany({
      where: applicationWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        fullName: true,
        status: true,
        createdAt: true,
        job: { select: { title: true } },
      },
    }),
  ]);
  return {
    stats: {
      total,
      pending,
      reviewing,
      shortlisted,
      offered,
      hired,
      rejected,
      activeJobs,
    },
    recent,
  };
}
