import "server-only";

import type { RecommendationStatus } from "@prisma/client";

import { recordAudit } from "@/lib/audit/audit";
import type { CollaborationActor } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import { canAccessAssignedJob } from "@/lib/auth/policy";
import {
  isRecommendableApplication,
  recommendableApplicationStatuses,
} from "@/modules/collaboration/recommendation-policy";
import { canTransitionReferral } from "@/modules/collaboration/referral-lifecycle";
import {
  recommendationModerationSchema,
  recommendationSchema,
} from "@/modules/collaboration/schema";

const referralExpiryMs = 30 * 24 * 60 * 60_000;

export async function getEmployeeProfile(actor: CollaborationActor) {
  return prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      employeeId: true,
      department: true,
      position: true,
      positionLevel: true,
      reportingManager: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listReferralJobs() {
  return prisma.job.findMany({
    where: {
      isActive: true,
      OR: [{ isPublished: true }, { isPublished: { isSet: false } }],
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      company: true,
      department: true,
      location: true,
    },
  });
}

export async function listOwnedRecommendations(actor: CollaborationActor) {
  return prisma.recommendation.findMany({
    where: { recommender: actor.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      recommendedUserName: true,
      recommendedUserEmail: true,
      candidatePhone: true,
      relationship: true,
      recommendationMessage: true,
      status: true,
      adminNotes: true,
      consentConfirmed: true,
      invitationSentAt: true,
      expiresAt: true,
      createdAt: true,
      reviewedAt: true,
      job: { select: { id: true, slug: true, title: true, company: true } },
      application: { select: { id: true, slug: true, status: true } },
    },
  });
}

export async function listRecommendableApplications(actor: CollaborationActor) {
  return prisma.application.findMany({
    where: {
      userId: { not: actor.id },
      OR: [{ recommendationId: null }, { recommendationId: { isSet: false } }],
      status: { in: [...recommendableApplicationStatuses] },
      user: { is: { status: "ACTIVE" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      status: true,
      job: { select: { id: true, title: true, company: true } },
    },
  });
}

async function ensureCapacity(actor: CollaborationActor) {
  const active = await prisma.recommendation.count({
    where: { recommender: actor.id, status: { in: ["PENDING", "REVIEWED"] } },
  });
  if (active >= 5)
    throw new ApiError(
      "At most five referrals may await a final decision",
      409,
    );
}

async function createExistingApplicationReferral(
  input: Extract<
    ReturnType<typeof recommendationSchema.parse>,
    { kind: "EXISTING_APPLICATION" }
  >,
  actor: CollaborationActor,
) {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    select: {
      id: true,
      userId: true,
      email: true,
      fullName: true,
      jobId: true,
      status: true,
      recommendationId: true,
      user: { select: { status: true } },
    },
  });
  if (!application) throw new ApiError("Application not found", 404);
  if (!application.userId || !application.user)
    throw new ApiError(
      "Only a registered applicant can be recommended through this option",
      409,
    );
  if (
    !isRecommendableApplication({
      applicantId: application.userId,
      applicantStatus: application.user.status,
      applicationStatus: application.status,
      recommenderId: actor.id,
      recommendationId: application.recommendationId,
    })
  )
    throw new ApiError("This application is not eligible for referral", 409);

  return prisma.$transaction(async (tx) => {
    const created = await tx.recommendation.create({
      data: {
        recommender: actor.id,
        recommenderId: actor.employeeId ?? actor.id,
        recommendedUser: application.userId,
        recommendedUserEmail: application.email.toLowerCase(),
        recommendedUserName: application.fullName,
        relationship: input.relationship,
        consentConfirmed: true,
        jobId: application.jobId,
        recommendationMessage: input.message,
        applicationId: application.id,
      },
      select: { id: true, status: true, createdAt: true },
    });
    const linked = await tx.application.updateMany({
      where: {
        id: application.id,
        OR: [
          { recommendationId: null },
          { recommendationId: { isSet: false } },
        ],
      },
      data: { recommendationId: created.id, isReferred: true },
    });
    if (linked.count !== 1)
      throw new ApiError(
        "Application referral changed; refresh and retry",
        409,
      );
    await tx.notification.upsert({
      where: { idempotencyKey: `referral:${created.id}:linked-candidate` },
      create: {
        idempotencyKey: `referral:${created.id}:linked-candidate`,
        userId: application.userId!,
        type: "SYSTEM",
        title: "Your application was referred",
        message: "An ConnectSphere employee endorsed your application for review.",
        relatedJobId: application.jobId,
        relatedApplicationId: application.id,
        priority: "MEDIUM",
        metadata: { referralId: created.id },
      },
      update: {},
    });
    return created;
  });
}

async function createCandidateReferral(
  input: Extract<
    ReturnType<typeof recommendationSchema.parse>,
    { kind: "NEW_CANDIDATE" }
  >,
  actor: CollaborationActor,
) {
  if (
    actor.id ===
    (
      await prisma.user.findUnique({
        where: { email: input.candidateEmail },
        select: { id: true },
      })
    )?.id
  )
    throw new ApiError("You cannot refer yourself", 409);
  const job = await prisma.job.findFirst({
    where: {
      id: input.jobId,
      isActive: true,
      OR: [{ isPublished: true }, { isPublished: { isSet: false } }],
    },
    select: { id: true, slug: true, title: true, company: true },
  });
  if (!job) throw new ApiError("Job not found or no longer open", 404);
  const existing = await prisma.recommendation.findFirst({
    where: {
      jobId: job.id,
      recommendedUserEmail: {
        equals: input.candidateEmail,
        mode: "insensitive",
      },
      status: { not: "REJECTED" },
    },
    select: { id: true },
  });
  if (existing)
    throw new ApiError(
      "This candidate already has an active referral for this job",
      409,
    );
  const application = await prisma.application.findFirst({
    where: {
      jobId: job.id,
      email: { equals: input.candidateEmail, mode: "insensitive" },
      status: { in: [...recommendableApplicationStatuses] },
    },
    select: { id: true, userId: true, recommendationId: true },
  });
  if (application?.recommendationId)
    throw new ApiError(
      "This candidate's application already has a referral",
      409,
    );
  const candidate = await prisma.user.findUnique({
    where: { email: input.candidateEmail },
    select: { id: true },
  });
  const expiresAt = new Date(Date.now() + referralExpiryMs);

  const created = await prisma.$transaction(async (tx) => {
    const referral = await tx.recommendation.create({
      data: {
        recommender: actor.id,
        recommenderId: actor.employeeId ?? actor.id,
        recommendedUser: candidate?.id ?? null,
        recommendedUserEmail: input.candidateEmail,
        recommendedUserName: input.candidateName,
        candidatePhone: input.candidatePhone || null,
        relationship: input.relationship,
        consentConfirmed: true,
        jobId: job.id,
        recommendationMessage: input.message,
        applicationId: application?.id ?? null,
        expiresAt,
      },
      select: { id: true, status: true, createdAt: true },
    });
    if (application) {
      const linked = await tx.application.updateMany({
        where: {
          id: application.id,
          OR: [
            { recommendationId: null },
            { recommendationId: { isSet: false } },
          ],
        },
        data: { recommendationId: referral.id, isReferred: true },
      });
      if (linked.count !== 1)
        throw new ApiError(
          "Application referral changed; refresh and retry",
          409,
        );
    }
    if (candidate?.id)
      await tx.notification.upsert({
        where: { idempotencyKey: `referral:${referral.id}:candidate` },
        create: {
          idempotencyKey: `referral:${referral.id}:candidate`,
          userId: candidate.id,
          type: "SYSTEM",
          title: "You were referred to an ConnectSphere role",
          message: `${actor.name} referred you for ${job.title}.`,
          relatedJobId: job.id,
          relatedApplicationId: application?.id ?? null,
          priority: "MEDIUM",
          metadata: { referralId: referral.id },
        },
        update: {},
      });
    return referral;
  });

  return created;
}

export async function createRecommendation(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = recommendationSchema.parse(raw);
  await ensureCapacity(actor);
  const recommendation =
    input.kind === "EXISTING_APPLICATION"
      ? await createExistingApplicationReferral(input, actor)
      : await createCandidateReferral(input, actor);
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "Recommendation",
    resourceId: recommendation.id,
    changes: { status: recommendation.status, kind: input.kind },
  });
  return recommendation;
}

export async function deleteOwnedRecommendation(
  id: string,
  actor: CollaborationActor,
) {
  const recommendation = await prisma.recommendation.findFirst({
    where: { id, recommender: actor.id },
    select: { id: true, status: true, applicationId: true },
  });
  if (!recommendation) throw new ApiError("Referral not found", 404);
  if (recommendation.status !== "PENDING")
    throw new ApiError("Only pending referrals can be withdrawn", 409);
  await prisma.$transaction(async (tx) => {
    if (recommendation.applicationId)
      await tx.application.updateMany({
        where: { id: recommendation.applicationId, recommendationId: id },
        data: { recommendationId: null, isReferred: false },
      });
    await tx.recommendation.delete({ where: { id } });
  });
  await recordAudit({
    actor,
    action: "DELETE",
    resourceEntity: "Recommendation",
    resourceId: id,
  });
}

function moderationWhere(
  actor: CollaborationActor,
  status?: RecommendationStatus,
) {
  return {
    ...(status ? { status } : {}),
    ...(actor.isAdministrator
      ? {}
      : { jobId: { in: [...actor.assignedJobs] } }),
  };
}

export async function listRecommendationsForModeration(
  actor: CollaborationActor,
  status?: RecommendationStatus,
) {
  return prisma.recommendation.findMany({
    where: moderationWhere(actor, status),
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      recommendedUserName: true,
      recommendedUserEmail: true,
      candidatePhone: true,
      relationship: true,
      consentConfirmed: true,
      invitationSentAt: true,
      expiresAt: true,
      recommendationMessage: true,
      adminNotes: true,
      status: true,
      createdAt: true,
      recommenderUser: { select: { id: true, name: true, employeeId: true } },
      job: { select: { id: true, title: true, company: true } },
      application: { select: { id: true, slug: true, status: true } },
    },
  });
}

export async function recommendationStatistics(actor: CollaborationActor) {
  const grouped = await prisma.recommendation.groupBy({
    by: ["status"],
    where: moderationWhere(actor),
    _count: { _all: true },
  });
  const counts: Record<RecommendationStatus, number> = {
    PENDING: 0,
    REVIEWED: 0,
    SELECTED: 0,
    REJECTED: 0,
  };
  for (const item of grouped) counts[item.status] = item._count._all;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return {
    total,
    ...counts,
    selectionRate:
      total === 0 ? 0 : Math.round((counts.SELECTED / total) * 100),
  };
}

export async function moderateRecommendation(
  id: string,
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = recommendationModerationSchema.parse(raw);
  const current = await prisma.recommendation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      jobId: true,
      recommender: true,
      recommendedUser: true,
      recommendedUserName: true,
      applicationId: true,
    },
  });
  if (!current) throw new ApiError("Referral not found", 404);
  if (!canAccessAssignedJob(actor, current.jobId))
    throw new ApiError("Referral is outside your assigned job scope", 403);
  if (!canTransitionReferral(current.status, input.status))
    throw new ApiError(
      `Cannot transition ${current.status} to ${input.status}`,
      409,
    );

  await prisma.$transaction(async (tx) => {
    const result = await tx.recommendation.updateMany({
      where: { id, status: current.status },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
        reviewedBy: actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    if (result.count !== 1)
      throw new ApiError("Referral changed; refresh and retry", 409);
    if (input.status === "SELECTED" && current.applicationId) {
      await tx.application.updateMany({
        where: { id: current.applicationId, status: "PENDING" },
        data: { status: "REVIEWING", updatedAt: new Date() },
      });
    }
    const recipients = [current.recommender, current.recommendedUser].filter(
      (value): value is string => Boolean(value),
    );
    for (const userId of recipients) {
      await tx.notification.upsert({
        where: {
          idempotencyKey: `referral:${id}:status:${input.status}:user:${userId}`,
        },
        create: {
          idempotencyKey: `referral:${id}:status:${input.status}:user:${userId}`,
          userId,
          type: "SYSTEM",
          title: "Referral status updated",
          message: `${current.recommendedUserName}'s referral is now ${input.status.toLowerCase()}.`,
          relatedJobId: current.jobId,
          relatedApplicationId: current.applicationId,
          priority:
            input.status === "SELECTED" || input.status === "REJECTED"
              ? "HIGH"
              : "MEDIUM",
          metadata: { referralId: id, status: input.status },
        },
        update: {},
      });
    }
  });
  await recordAudit({
    actor,
    action: input.status === "REJECTED" ? "REJECT" : "STATUS_CHANGE",
    resourceEntity: "Recommendation",
    resourceId: id,
    changes: { oldStatus: current.status, newStatus: input.status },
  });
}
