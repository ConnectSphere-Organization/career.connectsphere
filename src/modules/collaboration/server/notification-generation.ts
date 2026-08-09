import "server-only";

import type { ApplicationStatus, Prisma } from "@prisma/client";

import { enqueueOutbox, type TransactionClient } from "@/lib/outbox/outbox";

export async function createApplicationStatusNotification(
  transaction: TransactionClient,
  input: {
    applicationId: string;
    userId: string | null;
    jobId: string;
    jobTitle: string;
    status: ApplicationStatus;
  },
) {
  const key = `application:${input.applicationId}:status:${input.status}`;
  await enqueueOutbox(transaction, {
    idempotencyKey: key,
    topic: "application.status.changed",
    aggregateType: "Application",
    aggregateId: input.applicationId,
    payload: input as unknown as Prisma.InputJsonValue,
  });
  if (!input.userId) return;
  await transaction.notification.upsert({
    where: { idempotencyKey: key },
    create: {
      idempotencyKey: key,
      userId: input.userId,
      type: "APPLICATION_STATUS",
      title: "Application status updated",
      message: `Your application for ${input.jobTitle} is now ${input.status.toLowerCase()}.`,
      relatedJobId: input.jobId,
      relatedApplicationId: input.applicationId,
      priority:
        input.status === "REJECTED" || input.status === "OFFERED"
          ? "HIGH"
          : "MEDIUM",
      metadata: { status: input.status },
    },
    update: {},
  });
  const referral = await transaction.recommendation.findFirst({
    where: { applicationId: input.applicationId },
    select: { id: true, recommender: true, recommendedUserName: true },
  });
  if (referral && referral.recommender !== input.userId) {
    const referralKey = `referral:${referral.id}:application-status:${input.status}`;
    await transaction.notification.upsert({
      where: { idempotencyKey: referralKey },
      create: {
        idempotencyKey: referralKey,
        userId: referral.recommender,
        type: "SYSTEM",
        title: "Referred application updated",
        message: `${referral.recommendedUserName}'s application is now ${input.status.toLowerCase()}.`,
        relatedJobId: input.jobId,
        relatedApplicationId: input.applicationId,
        priority:
          input.status === "OFFERED" ||
          input.status === "HIRED" ||
          input.status === "REJECTED"
            ? "HIGH"
            : "MEDIUM",
        metadata: { referralId: referral.id, applicationStatus: input.status },
      },
      update: {},
    });
  }
}

export async function createJobUpdateNotifications(
  transaction: TransactionClient,
  input: {
    jobId: string;
    title: string;
    changedFields: string[];
    requirements: string[];
    responsibilities: string[];
  },
) {
  if (input.changedFields.length === 0) return;
  const version = Buffer.from(
    JSON.stringify([
      input.changedFields,
      input.requirements,
      input.responsibilities,
    ]),
  )
    .toString("base64url")
    .slice(0, 80);
  const recipients = await transaction.application.findMany({
    where: { jobId: input.jobId, userId: { not: null } },
    distinct: ["userId"],
    select: { userId: true },
  });
  for (const recipient of recipients) {
    if (!recipient.userId) continue;
    const key = `job:${input.jobId}:update:${version}:user:${recipient.userId}`;
    await transaction.notification.upsert({
      where: { idempotencyKey: key },
      create: {
        idempotencyKey: key,
        userId: recipient.userId,
        type: "JOB_UPDATE",
        title: `${input.title} was updated`,
        message: `Updated fields: ${input.changedFields.join(", ")}.`,
        relatedJobId: input.jobId,
        jobUpdateDetails: {
          oldRequirements: [],
          newRequirements: input.requirements,
          oldResponsibilities: [],
          newResponsibilities: input.responsibilities,
          changedFields: input.changedFields,
          updateType:
            input.changedFields.includes("requirements") &&
            input.changedFields.includes("responsibilities")
              ? "BOTH"
              : input.changedFields.includes("requirements")
                ? "REQUIREMENTS"
                : input.changedFields.includes("responsibilities")
                  ? "RESPONSIBILITIES"
                  : "OTHER",
        },
        metadata: { changedFields: input.changedFields },
      },
      update: {},
    });
  }
  await enqueueOutbox(transaction, {
    idempotencyKey: `job:${input.jobId}:update:${version}`,
    topic: "job.updated",
    aggregateType: "Job",
    aggregateId: input.jobId,
    payload: input as unknown as Prisma.InputJsonValue,
  });
}
