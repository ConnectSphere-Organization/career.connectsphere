import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import {
  analyticsEventSchema,
  applicationDraftSchema,
} from "@/modules/engagement/schema";
import { publicJobBaseWhere } from "@/modules/jobs/server/public-jobs";

export async function candidateProfileFor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phoneNumber: true },
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
    select: { id: true },
  });
}

export async function listSavedJobs(userId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.savedJob.findMany({
    where: { candidateProfileId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          slug: true,
          title: true,
          company: true,
          location: true,
          type: true,
          applicationDeadline: true,
        },
      },
    },
  });
}

export async function saveJob(userId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { ...publicJobBaseWhere(), id: jobId },
    select: { id: true },
  });
  if (!job) throw new ApiError("Open job not found", 404);
  const profile = await candidateProfileFor(userId);
  return prisma.savedJob.upsert({
    where: {
      candidateProfileId_jobId: { candidateProfileId: profile.id, jobId },
    },
    create: { candidateProfileId: profile.id, jobId },
    update: {},
  });
}

export async function removeSavedJob(userId: string, jobId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return;
  await prisma.savedJob.deleteMany({
    where: { candidateProfileId: profile.id, jobId },
  });
}

export async function listApplicationDrafts(userId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];
  return prisma.applicationDraft.findMany({
    where: {
      candidateProfileId: profile.id,
      expiresAt: { gt: new Date() },
      submittedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      job: {
        select: { id: true, slug: true, title: true, company: true },
      },
    },
  });
}

export async function upsertApplicationDraft(userId: string, raw: unknown) {
  const input = applicationDraftSchema.parse(raw);
  const job = await prisma.job.findFirst({
    where: { ...publicJobBaseWhere(), id: input.jobId },
    select: { id: true },
  });
  if (!job) throw new ApiError("Open job not found", 404);
  const profile = await candidateProfileFor(userId);
  return prisma.applicationDraft.upsert({
    where: {
      candidateProfileId_jobId: {
        candidateProfileId: profile.id,
        jobId: input.jobId,
      },
    },
    create: {
      candidateProfileId: profile.id,
      jobId: input.jobId,
      payload: input.payload as Prisma.InputJsonValue,
      currentStep: input.currentStep,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
    },
    update: {
      payload: input.payload as Prisma.InputJsonValue,
      currentStep: input.currentStep,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
      submittedAt: null,
    },
  });
}

export async function deleteApplicationDraft(userId: string, jobId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return;
  await prisma.applicationDraft.deleteMany({
    where: { candidateProfileId: profile.id, jobId },
  });
}

export async function recordAnalyticsEvent(raw: unknown, userId?: string) {
  const input = analyticsEventSchema.parse(raw);
  const data: Prisma.AnalyticsEventUncheckedCreateInput = {
    name: input.name,
    userId: userId ?? null,
    anonymousId: input.anonymousId ?? null,
    jobId: input.jobId ?? null,
    applicationId: input.applicationId ?? null,
    sessionId: input.sessionId ?? null,
    source: input.source ?? null,
    medium: input.medium ?? null,
    campaign: input.campaign ?? null,
    metadata: input.metadata as Prisma.InputJsonValue,
  };
  return prisma.analyticsEvent.create({ data, select: { id: true } });
}

export async function publishedCareerContent() {
  return prisma.careerContent.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ type: "asc" }, { order: "asc" }],
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      summary: true,
      body: true,
      imageUrl: true,
      location: true,
    },
  });
}
