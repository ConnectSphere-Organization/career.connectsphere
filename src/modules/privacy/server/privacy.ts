import "server-only";

import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";

async function profileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phoneNumber: true },
  });
  if (!user) throw new ApiError("User not found", 404);
  return prisma.candidateProfile.upsert({
    where: { userId },
    create: {
      userId,
      primaryEmail: user.email,
      normalizedEmail: user.email.trim().toLowerCase(),
      phone: user.phoneNumber,
      retentionUntil: new Date(Date.now() + 730 * 24 * 60 * 60_000),
    },
    update: {
      primaryEmail: user.email,
      normalizedEmail: user.email.trim().toLowerCase(),
      phone: user.phoneNumber,
    },
    select: {
      id: true,
      primaryEmail: true,
      phone: true,
      retentionUntil: true,
      anonymizedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getPrivacyCenter(userId: string) {
  const profile = await profileForUser(userId);
  const [consents, requests] = await Promise.all([
    prisma.consentRecord.findMany({
      where: { candidateProfileId: profile.id },
      orderBy: { acceptedAt: "desc" },
      select: {
        id: true,
        purpose: true,
        legalBasis: true,
        policyVersion: true,
        source: true,
        acceptedAt: true,
        withdrawnAt: true,
      },
    }),
    prisma.dataSubjectRequest.findMany({
      where: { candidateProfileId: profile.id },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        requestedAt: true,
        dueAt: true,
        completedAt: true,
        notes: true,
      },
    }),
  ]);
  return { profile, consents, requests };
}

export async function createDeletionRequest(userId: string) {
  const profile = await profileForUser(userId);
  const existing = await prisma.dataSubjectRequest.findFirst({
    where: {
      candidateProfileId: profile.id,
      type: "DELETION",
      status: { in: ["REQUESTED", "VERIFYING", "IN_PROGRESS"] },
    },
    select: { id: true },
  });
  if (existing)
    throw new ApiError("A deletion request is already being processed", 409);
  return prisma.$transaction(async (tx) => {
    const request = await tx.dataSubjectRequest.create({
      data: {
        candidateProfileId: profile.id,
        type: "DELETION",
        status: "REQUESTED",
        dueAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
      },
      select: { id: true, status: true, requestedAt: true, dueAt: true },
    });
    await tx.auditLog.create({
      data: {
        actor: userId,
        actorRole: "USER",
        action: "CREATE",
        resourceEntity: "DataSubjectRequest",
        resourceId: request.id,
        changes: { type: "DELETION", status: request.status },
      },
    });
    return request;
  });
}

export async function exportCandidateData(userId: string) {
  const profile = await profileForUser(userId);
  const [
    user,
    applications,
    recommendations,
    consents,
    requests,
    notifications,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
      },
    }),
    prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        fullName: true,
        email: true,
        phone: true,
        experience: true,
        education: true,
        skills: true,
        coverLetter: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        job: { select: { id: true, title: true, company: true } },
      },
    }),
    prisma.recommendation.findMany({
      where: {
        OR: [
          { recommendedUser: userId },
          {
            recommendedUserEmail: {
              equals: profile.primaryEmail,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        recommendedUserName: true,
        recommendedUserEmail: true,
        relationship: true,
        recommendationMessage: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        job: { select: { title: true, company: true } },
      },
    }),
    prisma.consentRecord.findMany({
      where: { candidateProfileId: profile.id },
      select: {
        purpose: true,
        legalBasis: true,
        policyVersion: true,
        source: true,
        acceptedAt: true,
        withdrawnAt: true,
      },
    }),
    prisma.dataSubjectRequest.findMany({
      where: { candidateProfileId: profile.id },
      select: {
        type: true,
        status: true,
        requestedAt: true,
        dueAt: true,
        completedAt: true,
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
      },
    }),
  ]);
  await prisma.auditLog.create({
    data: {
      actor: userId,
      actorRole: "USER",
      action: "DOWNLOAD",
      resourceEntity: "CandidateProfile",
      resourceId: profile.id,
      changes: { operation: "data-export" },
    },
  });
  return {
    exportedAt: new Date().toISOString(),
    profile,
    user,
    applications,
    referrals: recommendations,
    consents,
    privacyRequests: requests,
    notifications,
  };
}
