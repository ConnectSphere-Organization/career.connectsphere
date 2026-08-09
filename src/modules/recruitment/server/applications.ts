import "server-only";

import { ApplicationStatus, type Prisma } from "@prisma/client";

import {
  assertAssignedJob,
  type RecruitmentActor,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import { applicationStatusInputSchema } from "@/modules/recruitment/applications/schema";
import {
  employeeIdForUser,
  employeeRoleAfterHire,
  employmentProfileAfterHire,
} from "@/modules/recruitment/applications/employee-promotion";
import { maskSensitiveValue } from "@/lib/security/contract-encryption";
import { privateDocumentDownloadUrl } from "@/lib/uploads/cloudinary";
import { createApplicationStatusNotification } from "@/modules/collaboration/server/notification-generation";
import { upsertEmployeeMaster } from "@/modules/people/server/employee-master";
import {
  allowedStatusTransitions,
  canTransitionApplicationStatus,
} from "@/modules/recruitment/applications/status-transitions";

export { allowedStatusTransitions } from "@/modules/recruitment/applications/status-transitions";

const objectIdPattern = /^[a-f\d]{24}$/i;

function applicationLookup(identifier: string): Prisma.ApplicationWhereInput {
  return objectIdPattern.test(identifier)
    ? { OR: [{ id: identifier }, { slug: identifier }] }
    : { slug: identifier };
}

function scopedWhere(actor: RecruitmentActor): Prisma.ApplicationWhereInput {
  return actor.isAdministrator
    ? {}
    : { jobId: { in: [...actor.assignedJobs] } };
}

export async function listScopedApplications(
  actor: RecruitmentActor,
  status?: ApplicationStatus,
) {
  return prisma.application.findMany({
    where: { ...scopedWhere(actor), ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      fullName: true,
      email: true,
      status: true,
      createdAt: true,
      job: { select: { id: true, slug: true, title: true, company: true } },
    },
  });
}

export async function listJobApplications(
  jobId: string,
  actor: RecruitmentActor,
) {
  assertAssignedJob(actor, jobId);
  return prisma.application.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      fullName: true,
      email: true,
      status: true,
      createdAt: true,
      cloudinaryPublicId: true,
    },
  });
}

export async function getScopedApplication(
  identifier: string,
  actor: RecruitmentActor,
) {
  const application = await prisma.application.findFirst({
    where: applicationLookup(identifier),
    select: {
      id: true,
      slug: true,
      jobId: true,
      userId: true,
      fullName: true,
      email: true,
      phone: true,
      cloudinaryPublicId: true,
      experience: true,
      education: true,
      skills: true,
      coverLetter: true,
      questionAnswers: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      job: {
        select: {
          id: true,
          slug: true,
          title: true,
          company: true,
          description: true,
          requirements: true,
          responsibilities: true,
          questions: true,
          department: true,
          location: true,
          type: true,
          salary: true,
          position: true,
          reportingManager: true,
          hrContact: true,
        },
      },
      offers: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          shortId: true,
          status: true,
          acceptedAt: true,
          position: true,
          department: true,
          salary: true,
          payoutFrequency: true,
          startDate: true,
          endDate: true,
          duration: true,
          validUntil: true,
          workType: true,
          joiningLocation: true,
          issuedOn: true,
        },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          email: true,
          phone: true,
          personalInfo: true,
          bankingInfo: true,
          employmentDetails: true,
          status: true,
          workflowStatus: true,
          acceptedAt: true,
          acceptanceComments: true,
          adminComments: true,
          createdAt: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              fileName: true,
              uploadedAt: true,
            },
          },
        },
      },
    },
  });
  if (!application) throw new ApiError("Application not found", 404);
  assertAssignedJob(actor, application.jobId);
  const contract = application.contracts[0];
  return {
    id: application.id,
    slug: application.slug,
    jobId: application.jobId,
    userId: application.userId,
    cloudinaryPublicId: application.cloudinaryPublicId,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    experience: application.experience,
    education: application.education,
    skills: application.skills,
    coverLetter: application.coverLetter,
    questionAnswers: application.questionAnswers.map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      questionText: answer.questionText,
      questionType: answer.questionType,
      answer: answer.answer,
      hasFile: Boolean(answer.cloudinaryPublicId),
    })),
    status: application.status,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    resumeAvailable: Boolean(application.cloudinaryPublicId),
    job: application.job,
    offer: application.offers[0] ?? null,
    contract: contract
      ? {
        id: contract.id,
        email: contract.email,
        phone: contract.phone,
        status: contract.status,
        workflowStatus: contract.workflowStatus,
        acceptedAt: contract.acceptedAt,
        acceptanceComments: contract.acceptanceComments,
        adminComments: contract.adminComments,
        createdAt: contract.createdAt,
        employmentDetails: contract.employmentDetails,
        personalInfo: contract.personalInfo
          ? {
            dateOfBirth: contract.personalInfo.dateOfBirth,
            nationality: contract.personalInfo.nationality,
            address: contract.personalInfo.address,
            emergencyContact: contract.personalInfo.emergencyContact,
            identification: contract.personalInfo.identificationDocuments
              ? {
                idType:
                  contract.personalInfo.identificationDocuments.idType,
                idNumber: maskSensitiveValue(
                  contract.personalInfo.identificationDocuments.idNumber,
                ),
              }
              : null,
          }
          : null,
        bankingInfo: contract.bankingInfo
          ? {
            accountHolderName: contract.bankingInfo.accountHolderName,
            accountNumber: maskSensitiveValue(
              contract.bankingInfo.accountNumber,
            ),
            bankName: contract.bankingInfo.bankName,
            ifscCode: maskSensitiveValue(contract.bankingInfo.ifscCode),
            accountType: contract.bankingInfo.accountType,
            branch: contract.bankingInfo.branch,
          }
          : null,
        documents: contract.documents,
      }
      : null,
  };
}

export async function transitionApplicationStatus(
  identifier: string,
  input: unknown,
  actor: RecruitmentActor,
) {
  const application = await getScopedApplication(identifier, actor);
  const { status } = applicationStatusInputSchema.parse(input);
  if (!canTransitionApplicationStatus(application.status, status)) {
    throw new ApiError(
      `Cannot transition application from ${application.status} to ${status}`,
      409,
    );
  }
  if (
    status === ApplicationStatus.HIRED &&
    (application.offer?.status !== "ACCEPTED" || !application.contract)
  ) {
    throw new ApiError(
      "Candidate must accept the offer and submit onboarding before hiring",
      409,
      "ONBOARDING_REQUIRED",
    );
  }

  await prisma.$transaction(async (transaction) => {
    const result = await transaction.application.updateMany({
      where: { id: application.id, status: application.status },
      data: { status, updatedAt: new Date() },
    });
    if (result.count !== 1)
      throw new ApiError(
        "Application changed while being reviewed; refresh and retry",
        409,
      );
    if (status === ApplicationStatus.HIRED) {
      const user = await transaction.user.findFirst({
        where: application.userId
          ? { id: application.userId }
          : { email: application.email.toLowerCase() },
        select: { id: true, role: true, employeeId: true },
      });
      if (!user)
        throw new ApiError(
          "The hired applicant must have a registered user account",
          409,
          "HIRED_USER_REQUIRED",
        );

      const profile = employmentProfileAfterHire({
        offer: application.offer,
        job: application.job,
      });
      const promoted = await transaction.user.update({
        where: { id: user.id },
        data: {
          role: employeeRoleAfterHire(user.role),
          status: "ACTIVE",
          employeeId: user.employeeId ?? employeeIdForUser(user.id),
          position: profile.position,
          department: profile.department,
          reportingManager: profile.reportingManager,
        },
        select: {
          id: true,
          role: true,
          employeeId: true,
          position: true,
          department: true,
          reportingManager: true,
        },
      });
      await upsertEmployeeMaster(transaction, {
        userId: user.id,
        employeeCode: promoted.employeeId!,
        departmentName: promoted.department ?? "General",
        designationName: promoted.position ?? application.job.title,
        positionLevel: "JUNIOR",
        joinedAt: application.contract?.acceptedAt ?? new Date(),
        employmentType: application.job.type,
      });
      if (!application.userId) {
        await transaction.application.update({
          where: { id: application.id },
          data: { userId: user.id },
        });
      }
      await transaction.auditLog.create({
        data: {
          actor: actor.id,
          actorRole: actor.role,
          action: "STATUS_CHANGE",
          resourceEntity: "User",
          resourceId: user.id,
          changes: {
            operation: "auto-promote-on-hire",
            role: promoted.role,
            employeeId: promoted.employeeId,
            position: promoted.position,
            department: promoted.department,
            reportingManager: promoted.reportingManager,
          },
        },
      });
    }
    await transaction.auditLog.create({
      data: {
        actor: actor.id,
        actorRole: actor.role,
        action:
          status === ApplicationStatus.REJECTED ? "REJECT" : "STATUS_CHANGE",
        resourceEntity: "Application",
        resourceId: application.id,
        changes: { oldStatus: application.status, newStatus: status },
      },
    });
    await createApplicationStatusNotification(transaction, {
      applicationId: application.id,
      userId: application.userId,
      jobId: application.jobId,
      jobTitle: application.job.title,
      status,
    });
  });
  return {
    id: application.id,
    slug: application.slug,
    status,
    allowedTransitions: allowedStatusTransitions(status),
  };
}

export async function applicationAnswerFileUrl(
  identifier: string,
  answerId: string,
  actor: RecruitmentActor,
): Promise<string> {
  const application = await getScopedApplication(identifier, actor);
  const raw = await prisma.application.findUnique({
    where: { id: application.id },
    select: { questionAnswers: true },
  });
  const answer = raw?.questionAnswers.find((item) => item.id === answerId);
  if (!answer?.cloudinaryPublicId)
    throw new ApiError("Answer file not found", 404);
  await prisma.auditLog.create({
    data: {
      actor: actor.id,
      actorRole: actor.role,
      action: "DOWNLOAD",
      resourceEntity: "Application",
      resourceId: application.id,
      changes: { document: "question-answer" },
    },
  });
  return privateDocumentDownloadUrl(answer.cloudinaryPublicId);
}

