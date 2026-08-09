import "server-only";

import { randomUUID } from "node:crypto";

import { ApplicationStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  deletePrivateDocument,
  uploadPrivateDocument,
} from "@/lib/uploads/cloudinary";
import { applicationFieldsSchema } from "@/modules/applications/schema";
import { publicJobVisibilityFilters } from "@/modules/jobs/server/public-jobs";

const objectIdPattern = /^[a-f\d]{24}$/i;
const acceptedDocumentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const maxDocumentBytes = 10 * 1024 * 1024;

export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function validateDocument(
  value: FormDataEntryValue | null,
  label: string,
): File {
  if (!(value instanceof File) || value.size === 0)
    throw new ApplicationError(`${label} is required`, 400);
  if (value.size > maxDocumentBytes)
    throw new ApplicationError(`${label} must be 10 MB or smaller`, 413);
  if (!acceptedDocumentTypes.has(value.type))
    throw new ApplicationError(
      `${label} must be a PDF, DOC, or DOCX file`,
      400,
    );
  return value;
}

function jobLookup(identifier: string): Prisma.JobWhereInput {
  return objectIdPattern.test(identifier)
    ? { OR: [{ id: identifier }, { slug: identifier }] }
    : { slug: identifier };
}

export async function submitOwnedApplication(
  formData: FormData,
  userId: string,
  request?: Request,
) {
  const answersValue = formData.get("questionAnswers");
  let questionAnswers: unknown = null;
  if (typeof answersValue === "string") {
    try {
      questionAnswers = JSON.parse(answersValue);
    } catch {
      throw new ApplicationError("Invalid question answers", 400);
    }
  }
  const parsed = applicationFieldsSchema.safeParse({
    jobIdentifier: formData.get("jobIdentifier"),
    referralId: formData.get("referralId") ?? "",
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    experience: formData.get("experience") ?? "",
    education: formData.get("education") ?? "",
    skills: formData.get("skills"),
    coverLetter: formData.get("coverLetter"),
    questionAnswers,
    privacyConsentAccepted: formData.get("privacyConsentAccepted") === "true",
    privacyPolicyVersion: formData.get("privacyPolicyVersion"),
  });
  if (!parsed.success)
    throw new ApplicationError(
      parsed.error.issues[0]?.message ?? "Invalid application",
      400,
    );

  const job = await prisma.job.findFirst({
    where: {
      isActive: true,
      archivedAt: null,
      AND: [
        ...publicJobVisibilityFilters(),
        jobLookup(parsed.data.jobIdentifier),
      ],
    },
    select: { id: true, questions: true },
  });
  if (!job)
    throw new ApplicationError(
      "Job not found or no longer accepting applications",
      404,
    );

  const existing = await prisma.application.findFirst({
    where: {
      jobId: job.id,
      userId,
      status: { not: ApplicationStatus.REJECTED },
    },
    select: { id: true, status: true },
  });
  if (existing)
    throw new ApplicationError(
      "You already have an active application for this job",
      409,
    );

  const referral = parsed.data.referralId
    ? await prisma.recommendation.findFirst({
        where: {
          id: parsed.data.referralId,
          jobId: job.id,
          recommendedUserEmail: {
            equals: parsed.data.email,
            mode: "insensitive",
          },
          applicationId: null,
          status: { in: ["PENDING", "REVIEWED", "SELECTED"] },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
            { expiresAt: { isSet: false } },
          ],
        },
        select: { id: true, recommender: true, status: true },
      })
    : null;
  if (parsed.data.referralId && !referral)
    throw new ApplicationError(
      "Referral invitation is invalid, expired, or belongs to another email address",
      409,
    );

  const uploadedPublicIds: string[] = [];
  try {
    const resume = validateDocument(formData.get("resume"), "Resume");
    const resumeAsset = await uploadPrivateDocument(resume, "resumes");
    uploadedPublicIds.push(resumeAsset.publicId);

    const questionAnswers: Prisma.QuestionAnswerCreateInput[] = [];
    for (const question of [...job.questions].sort(
      (left, right) => left.order - right.order,
    )) {
      if (!question.id) continue;
      let answer = parsed.data.questionAnswers[question.id];
      let fileUrl: string | undefined;
      let cloudinaryPublicId: string | undefined;
      if (question.questionType === "FILE") {
        const fileValue = formData.get(`questionFile:${question.id}`);
        if (fileValue instanceof File && fileValue.size > 0) {
          const file = validateDocument(fileValue, question.questionText);
          const asset = await uploadPrivateDocument(
            file,
            "application-answers",
          );
          uploadedPublicIds.push(asset.publicId);
          fileUrl = asset.url;
          cloudinaryPublicId = asset.publicId;
          answer = file.name;
        }
      }
      const empty =
        answer === undefined ||
        answer === "" ||
        (Array.isArray(answer) && answer.length === 0);
      if (question.required && empty && !fileUrl)
        throw new ApplicationError(`${question.questionText} is required`, 400);
      if (!empty || fileUrl) {
        questionAnswers.push({
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          answer: answer as Prisma.InputJsonValue,
          ...(fileUrl ? { fileUrl } : {}),
          ...(cloudinaryPublicId ? { cloudinaryPublicId } : {}),
        });
      }
    }

    const skills = [
      ...new Set(
        parsed.data.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      ),
    ];
    const application = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { email: true, phoneNumber: true },
      });
      const profile = await tx.candidateProfile.upsert({
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
          anonymizedAt: null,
        },
        select: { id: true },
      });
      const created = await tx.application.create({
        data: {
          slug: `${parsed.data.fullName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}-${randomUUID().slice(0, 8)}`,
          jobId: job.id,
          userId,
          fullName: parsed.data.fullName,
          email: parsed.data.email.toLowerCase(),
          phone: parsed.data.phone,
          resumeUrl: resumeAsset.url,
          cloudinaryPublicId: resumeAsset.publicId,
          experience: parsed.data.experience || null,
          education: parsed.data.education || null,
          skills,
          coverLetter: parsed.data.coverLetter,
          questionAnswers,
          ...(referral?.status === "SELECTED"
            ? { status: ApplicationStatus.REVIEWING }
            : {}),
          ...(referral
            ? { recommendationId: referral.id, isReferred: true }
            : {}),
        },
        select: { id: true, slug: true, status: true, createdAt: true },
      });
      await tx.consentRecord.create({
        data: {
          candidateProfileId: profile.id,
          applicationId: created.id,
          purpose: "APPLICATION_PROCESSING",
          legalBasis: "CONSENT",
          policyVersion: parsed.data.privacyPolicyVersion,
          source: "APPLICATION_FORM",
          ipAddress:
            request?.headers
              .get("x-forwarded-for")
              ?.split(",")[0]
              ?.trim()
              .slice(0, 64) ?? null,
          userAgent: request?.headers.get("user-agent")?.slice(0, 500) ?? null,
        },
      });
      if (referral) {
        const linked = await tx.recommendation.updateMany({
          where: { id: referral.id, applicationId: null },
          data: {
            applicationId: created.id,
            recommendedUser: userId,
            updatedAt: new Date(),
          },
        });
        if (linked.count !== 1)
          throw new ApplicationError(
            "Referral was already claimed; reload and try again",
            409,
          );
        await tx.notification.upsert({
          where: {
            idempotencyKey: `referral:${referral.id}:candidate-applied`,
          },
          create: {
            idempotencyKey: `referral:${referral.id}:candidate-applied`,
            userId: referral.recommender,
            type: "SYSTEM",
            title: "Referred candidate applied",
            message: `${parsed.data.fullName} submitted their application.`,
            relatedJobId: job.id,
            relatedApplicationId: created.id,
            priority: "MEDIUM",
            metadata: { referralId: referral.id },
          },
          update: {},
        });
      }
      return created;
    });
    return application;
  } catch (error) {
    await Promise.allSettled(
      uploadedPublicIds.map((publicId) => deletePrivateDocument(publicId)),
    );
    throw error;
  }
}

export async function listOwnedApplications(userId: string) {
  return prisma.application
    .findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        job: {
          select: {
            id: true,
            slug: true,
            title: true,
            company: true,
            location: true,
            type: true,
          },
        },
        offers: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            shortId: true,
            status: true,
            position: true,
            department: true,
            startDate: true,
            validUntil: true,
            workType: true,
          },
        },
      },
    })
    .then((applications) =>
      applications.map(({ offers, ...application }) => ({
        ...application,
        offer: offers[0] ?? null,
      })),
    );
}

export async function getOwnedApplicationStatus(
  jobIdentifier: string,
  userId: string,
) {
  const job = await prisma.job.findFirst({
    where: jobLookup(jobIdentifier),
    select: { id: true },
  });
  if (!job) throw new ApplicationError("Job not found", 404);
  const application = await prisma.application.findFirst({
    where: {
      jobId: job.id,
      userId,
      status: { not: ApplicationStatus.REJECTED },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, status: true, createdAt: true },
  });
  return application
    ? { hasApplied: true as const, application }
    : { hasApplied: false as const, application: null };
}
