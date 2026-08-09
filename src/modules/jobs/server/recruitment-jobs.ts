import "server-only";

import type { Prisma } from "@prisma/client";

import {
  assertAssignedJob,
  type RecruitmentActor,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import {
  deleteCloudinaryAsset,
  uploadJobImage,
} from "@/lib/uploads/cloudinary";
import { jobInputSchema, type JobInput } from "@/modules/jobs/schema";
import { generateUniqueJobSlug } from "@/modules/jobs/server/job-slugs";
import { createJobUpdateNotifications } from "@/modules/collaboration/server/notification-generation";

const objectIdPattern = /^[a-f\d]{24}$/i;

function jobLookup(identifier: string): Prisma.JobWhereInput {
  return objectIdPattern.test(identifier)
    ? { OR: [{ id: identifier }, { slug: identifier }] }
    : { slug: identifier };
}

function cleanOptional(value: string): string | null {
  return value || null;
}

function jobData(input: JobInput): Prisma.JobUncheckedCreateInput {
  return {
    title: input.title,
    company: input.company,
    description: input.description,
    requirements: input.requirements,
    responsibilities: input.responsibilities,
    location: cleanOptional(input.location),
    type: input.type,
    salary: cleanOptional(input.salary),
    department: cleanOptional(input.department),
    position: cleanOptional(input.position),
    reportingManager: cleanOptional(input.reportingManager),
    requisitionId: cleanOptional(input.requisitionId),
    headcount: input.headcount,
    applicationDeadline: input.applicationDeadline
      ? new Date(`${input.applicationDeadline}T23:59:59.999Z`)
      : null,
    publishAt: input.publishAt ? new Date(input.publishAt) : null,
    unpublishAt: input.unpublishAt ? new Date(input.unpublishAt) : null,
    archivedAt: input.archived ? new Date() : null,
    isActive: input.isActive,
    isPublished: input.isPublished,
    hrContact: {
      name: cleanOptional(input.hrContact.name),
      email: cleanOptional(input.hrContact.email),
      phone: cleanOptional(input.hrContact.phone),
    },
    questions: input.questions.map((question, order) => ({
      ...(question.id ? { id: question.id } : {}),
      questionText: question.questionText,
      questionType: question.questionType,
      required: question.required,
      options: question.options,
      maxRating: question.maxRating,
      order,
    })),
    updatedAt: new Date(),
  };
}

export async function listScopedJobs(actor: RecruitmentActor) {
  return prisma.job.findMany({
    where: actor.isAdministrator ? {} : { id: { in: [...actor.assignedJobs] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      company: true,
      department: true,
      isActive: true,
      isPublished: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });
}

export async function getScopedJob(
  identifier: string,
  actor: RecruitmentActor,
) {
  const job = await prisma.job.findFirst({
    where: jobLookup(identifier),
    select: {
      id: true,
      slug: true,
      title: true,
      company: true,
      description: true,
      requirements: true,
      responsibilities: true,
      location: true,
      type: true,
      salary: true,
      department: true,
      position: true,
      reportingManager: true,
      requisitionId: true,
      headcount: true,
      applicationDeadline: true,
      publishAt: true,
      unpublishAt: true,
      archivedAt: true,
      imageUrl: true,
      cloudinaryPublicId: true,
      isActive: true,
      isPublished: true,
      hrContact: true,
      questions: true,
      _count: { select: { applications: true } },
    },
  });
  if (!job) throw new ApiError("Job not found", 404);
  assertAssignedJob(actor, job.id);
  return job;
}

export async function createScopedJob(input: unknown, actor: RecruitmentActor) {
  const parsed = jobInputSchema.parse(input);
  const slug = await generateUniqueJobSlug(parsed.title);
  const job = await prisma.job.create({
    data: {
      ...jobData(parsed),
      slug,
      postedBy: actor.id,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      isActive: true,
      isPublished: true,
    },
  });
  if (!actor.isAdministrator) {
    await prisma.user.update({
      where: { id: actor.id },
      data: { assignedJobs: { push: job.id } },
    });
  }
  await prisma.auditLog.create({
    data: {
      actor: actor.id,
      actorRole: actor.role,
      action: "CREATE",
      resourceEntity: "Job",
      resourceId: job.id,
      changes: {
        title: job.title,
        isActive: job.isActive,
        isPublished: job.isPublished,
      },
    },
  });
  return job;
}

export async function updateScopedJob(
  identifier: string,
  input: unknown,
  actor: RecruitmentActor,
) {
  const existing = await getScopedJob(identifier, actor);
  const parsed = jobInputSchema.parse(input);
  const changedFields = (
    [
      "title",
      "requirements",
      "responsibilities",
      "isActive",
      "isPublished",
    ] as const
  ).filter(
    (field) =>
      JSON.stringify(existing[field]) !== JSON.stringify(parsed[field]),
  );
  const job = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.job.update({
      where: { id: existing.id },
      data: jobData(parsed),
      select: {
        id: true,
        slug: true,
        title: true,
        isActive: true,
        isPublished: true,
      },
    });
    await transaction.auditLog.create({
      data: {
        actor: actor.id,
        actorRole: actor.role,
        action: "UPDATE",
        resourceEntity: "Job",
        resourceId: updated.id,
        changes: {
          title: { from: existing.title, to: updated.title },
          isActive: { from: existing.isActive, to: updated.isActive },
          isPublished: {
            from: existing.isPublished ?? false,
            to: updated.isPublished ?? false,
          },
        },
      },
    });
    await createJobUpdateNotifications(transaction, {
      jobId: updated.id,
      title: updated.title,
      changedFields: [...changedFields],
      requirements: parsed.requirements,
      responsibilities: parsed.responsibilities,
    });
    return updated;
  });
  return job;
}

export async function replaceScopedJobImage(
  identifier: string,
  file: File,
  actor: RecruitmentActor,
) {
  const existing = await getScopedJob(identifier, actor);
  const current = await prisma.job.findUnique({
    where: { id: existing.id },
    select: { imageUrl: true, cloudinaryPublicId: true },
  });
  const uploaded = await uploadJobImage(file);
  try {
    const job = await prisma.job.update({
      where: { id: existing.id },
      data: {
        imageUrl: uploaded.url,
        cloudinaryPublicId: uploaded.publicId,
        updatedAt: new Date(),
      },
      select: { id: true, imageUrl: true, cloudinaryPublicId: true },
    });
    if (current?.cloudinaryPublicId)
      await deleteCloudinaryAsset(current.cloudinaryPublicId, "job-image");
    return job;
  } catch (error) {
    await deleteCloudinaryAsset(uploaded.publicId, "job-image").catch(
      () => undefined,
    );
    throw error;
  }
}

export async function removeScopedJobImage(
  identifier: string,
  actor: RecruitmentActor,
) {
  const existing = await getScopedJob(identifier, actor);
  const current = await prisma.job.findUnique({
    where: { id: existing.id },
    select: { cloudinaryPublicId: true },
  });
  await prisma.job.update({
    where: { id: existing.id },
    data: { imageUrl: null, cloudinaryPublicId: null, updatedAt: new Date() },
  });
  if (current?.cloudinaryPublicId) {
    try {
      await deleteCloudinaryAsset(current.cloudinaryPublicId, "job-image");
    } catch (error) {
      await prisma.job.update({
        where: { id: existing.id },
        data: { cloudinaryPublicId: current.cloudinaryPublicId },
      });
      throw error;
    }
  }
}
