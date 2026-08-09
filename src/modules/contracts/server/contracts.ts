import "server-only";

import { createHash } from "node:crypto";

import {
  ContractStatus,
  DocumentType,
  OfferStatus,
  WorkflowStageName,
} from "@prisma/client";

import {
  assertAssignedJob,
  type RecruitmentActor,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import {
  decryptContractPayload,
  encryptContractPayload,
  encryptContractValue,
  maskSensitiveValue,
} from "@/lib/security/contract-encryption";
import {
  deletePrivateDocument,
  privateDocumentDownloadUrl,
  uploadPrivateDocument,
} from "@/lib/uploads/cloudinary";
import {
  canTransitionContractStatus,
  contractDraftSchema,
  type ContractDraftInput,
  contractStatusSchema,
  contractSubmissionSchema,
} from "@/modules/contracts/schema";
import { renderDocumentPdf } from "@/modules/documents/server/pdf";
import { env } from "@/config/env";
import { parseOfferResponseToken } from "@/modules/documents/server/offer-response-token";

const objectIdPattern = /^[a-f\d]{24}$/i;
const maxDocumentBytes = 8 * 1024 * 1024;
const maxDocuments = 6;
const documentTypeValues = new Set(Object.values(DocumentType));
const acceptedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

function tokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
function date(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}
function nullable(value: string): string | null {
  return value || null;
}

async function validateContractDocument(
  value: FormDataEntryValue | null,
  required: boolean,
): Promise<File | null> {
  if (!(value instanceof File) || value.size === 0) {
    if (required)
      throw new ApiError(
        "Identity document is required",
        400,
        "DOCUMENT_REQUIRED",
      );
    return null;
  }
  if (value.size > maxDocumentBytes)
    throw new ApiError(
      "Each document must be 8 MB or smaller",
      413,
      "DOCUMENT_TOO_LARGE",
    );
  if (
    !value.name ||
    value.name.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(value.name)
  )
    throw new ApiError(
      "Document filename is invalid",
      400,
      "INVALID_DOCUMENT_NAME",
    );
  if (!acceptedMimeTypes.has(value.type))
    throw new ApiError(
      "Documents must be PDF, JPEG, or PNG",
      415,
      "UNSUPPORTED_DOCUMENT_TYPE",
    );
  const bytes = new Uint8Array(await value.slice(0, 8).arrayBuffer());
  const isPdf =
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const matchesMime =
    (value.type === "application/pdf" && isPdf) ||
    (value.type === "image/jpeg" && isJpeg) ||
    (value.type === "image/png" && isPng);
  if (!matchesMime)
    throw new ApiError(
      "Document content does not match its declared file type",
      415,
      "DOCUMENT_SIGNATURE_MISMATCH",
    );
  return value;
}

async function offerForOnboarding(token: string) {
  if (token.length < 32 || token.length > 200)
    throw new ApiError("Contract link is invalid", 404);
  const signed = parseOfferResponseToken(token, env.BETTER_AUTH_SECRET);
  const offer = await prisma.offerLetter.findUnique({
    where: signed
      ? { id: signed.offerId }
      : { acceptanceToken: tokenDigest(token) },
    select: {
      id: true,
      applicationId: true,
      userId: true,
      candidateName: true,
      email: true,
      position: true,
      department: true,
      salary: true,
      startDate: true,
      joiningLocation: true,
      workType: true,
      reportingManager: true,
      status: true,
      validUntil: true,
      contractId: true,
      onboardingDraft: true,
      draftUpdatedAt: true,
      draftDocuments: true,
    },
  });
  if (
    !offer ||
    (offer.status !== OfferStatus.PENDING &&
      offer.status !== OfferStatus.ACCEPTED) ||
    offer.contractId ||
    offer.validUntil.getTime() < Date.now()
  )
    throw new ApiError("Contract link is invalid or expired", 404);
  const linked = await prisma.offerLetter.findFirst({
    where: { id: offer.id, acceptanceToken: tokenDigest(token) },
    select: { id: true },
  });
  if (!linked) throw new ApiError("Contract link is invalid", 404);
  return offer;
}

export async function getContractOnboarding(token: string) {
  const offer = await offerForOnboarding(token);
  const draft = offer.onboardingDraft
    ? decryptContractPayload<ContractDraftInput>(offer.onboardingDraft)
    : null;
  return {
    candidateName: offer.candidateName,
    position: offer.position,
    department: offer.department,
    salary: offer.salary,
    startDate: offer.startDate,
    joiningLocation: offer.joiningLocation,
    workType: offer.workType,
    reportingManager: offer.reportingManager,
    draft,
    draftUpdatedAt: offer.draftUpdatedAt,
    draftDocuments: offer.draftDocuments.map(({ fileName, documentType }) => ({
      fileName,
      documentType,
    })),
  };
}

export async function saveContractDraft(token: string, input: unknown) {
  const offer = await offerForOnboarding(token);
  const draft = contractDraftSchema.parse(input);
  await prisma.offerLetter.update({
    where: { id: offer.id },
    data: {
      onboardingDraft: encryptContractPayload(draft),
      draftUpdatedAt: new Date(),
    },
  });
  return { savedAt: new Date() };
}

export async function saveContractDraftDocuments(
  token: string,
  formData: FormData,
) {
  const offer = await offerForOnboarding(token);
  const identity = await validateContractDocument(
    formData.get("identityDocument"),
    false,
  );
  const supporting = await validateContractDocument(
    formData.get("supportingDocument"),
    false,
  );
  if (!identity && !supporting)
    throw new ApiError("Select a document to save", 400);
  const uploaded: Array<{
    fileUrl: string;
    cloudinaryPublicId: string;
    fileName: string;
    documentType: DocumentType;
    uploadedAt: Date;
  }> = [];
  try {
    if (identity) {
      const asset = await uploadPrivateDocument(identity, "contract-documents");
      uploaded.push({
        fileUrl: asset.url,
        cloudinaryPublicId: asset.publicId,
        fileName: identity.name,
        documentType: DocumentType.ID_PROOF,
        uploadedAt: new Date(),
      });
    }
    if (supporting) {
      const typeValue = formData.get("supportingDocumentType");
      if (
        typeof typeValue !== "string" ||
        !documentTypeValues.has(typeValue as DocumentType)
      )
        throw new ApiError("Invalid supporting document type", 400);
      const asset = await uploadPrivateDocument(
        supporting,
        "contract-documents",
      );
      uploaded.push({
        fileUrl: asset.url,
        cloudinaryPublicId: asset.publicId,
        fileName: supporting.name,
        documentType: typeValue as DocumentType,
        uploadedAt: new Date(),
      });
    }
    await prisma.offerLetter.update({
      where: { id: offer.id },
      data: { draftDocuments: { push: uploaded }, draftUpdatedAt: new Date() },
    });
    return {
      documents: uploaded.map(({ fileName, documentType }) => ({
        fileName,
        documentType,
      })),
    };
  } catch (error) {
    await Promise.all(
      uploaded.map((item) => deletePrivateDocument(item.cloudinaryPublicId)),
    );
    throw error;
  }
}

export async function submitContract(
  token: string,
  body: FormData | { payload?: string },
  request: Request,
) {
  const offer = await offerForOnboarding(token);
  if (offer.contractId)
    throw new ApiError("Contract onboarding has already been submitted", 409);
  const payload = body instanceof FormData ? body.get("payload") : body.payload;
  if (typeof payload !== "string")
    throw new ApiError("Contract details are required", 400);
  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    throw new ApiError("Contract details are invalid", 400);
  }
  const parsed = contractSubmissionSchema.parse(raw);
  const needsIdentity = offer.draftDocuments.every(
    (item) => item.documentType !== DocumentType.ID_PROOF,
  );
  const identityFile =
    body instanceof FormData
      ? await validateContractDocument(
          body.get("identityDocument"),
          needsIdentity,
        )
      : null;
  if (!identityFile && needsIdentity)
    throw new ApiError("Identity document is required", 400);

  const supportingFiles: Array<{ file: File; type: DocumentType }> = [];
  if (body instanceof FormData) {
    for (let index = 0; index < maxDocuments - 1; index += 1) {
      const file = await validateContractDocument(
        body.get(`document:${index}`),
        false,
      );
      if (!file) continue;
      const typeValue = body.get(`documentType:${index}`);
      if (
        typeof typeValue !== "string" ||
        !documentTypeValues.has(typeValue as DocumentType)
      )
        throw new ApiError("Invalid supporting document type", 400);
      supportingFiles.push({ file, type: typeValue as DocumentType });
    }
  }

  const uploaded: Array<{
    url: string;
    publicId: string;
    fileName: string;
    documentType: DocumentType;
  }> = [];
  const newlyUploadedIds: string[] = [];
  try {
    uploaded.push(
      ...offer.draftDocuments
        .filter(
          (item) =>
            item.fileUrl &&
            item.cloudinaryPublicId &&
            item.fileName &&
            item.documentType,
        )
        .map((item) => ({
          url: item.fileUrl!,
          publicId: item.cloudinaryPublicId!,
          fileName: item.fileName!,
          documentType: item.documentType!,
        })),
    );
    if (identityFile) {
      const identityAsset = await uploadPrivateDocument(
        identityFile,
        "contract-documents",
      );
      uploaded.push({
        ...identityAsset,
        fileName: identityFile.name,
        documentType: DocumentType.ID_PROOF,
      });
      newlyUploadedIds.push(identityAsset.publicId);
    }
    for (const item of supportingFiles) {
      const asset = await uploadPrivateDocument(
        item.file,
        "contract-documents",
      );
      uploaded.push({
        ...asset,
        fileName: item.file.name,
        documentType: item.type,
      });
      newlyUploadedIds.push(asset.publicId);
    }
    const now = new Date();
    const forwarded = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const contract = await prisma.$transaction(async (transaction) => {
      const created = await transaction.employmentContract.create({
        data: {
          offerLetterId: offer.id,
          applicationId: offer.applicationId,
          candidateName: offer.candidateName,
          email: offer.email.toLowerCase(),
          phone: parsed.phone,
          personalInfo: {
            dateOfBirth: date(parsed.dateOfBirth),
            nationality: parsed.nationality,
            address: {
              street: parsed.street,
              city: parsed.city,
              state: parsed.state,
              zipCode: parsed.zipCode,
              country: parsed.country,
            },
            emergencyContact: {
              name: parsed.emergencyName,
              relationship: parsed.emergencyRelationship,
              phone: parsed.emergencyPhone,
              email: nullable(parsed.emergencyEmail),
            },
            identificationDocuments: {
              idType: parsed.idType,
              idNumber: encryptContractValue(parsed.idNumber),
              documentUrl:
                uploaded.find(
                  (item) => item.documentType === DocumentType.ID_PROOF,
                )?.url ?? null,
              cloudinaryPublicId:
                uploaded.find(
                  (item) => item.documentType === DocumentType.ID_PROOF,
                )?.publicId ?? null,
            },
          },
          bankingInfo: {
            accountHolderName: parsed.accountHolderName,
            accountNumber: encryptContractValue(parsed.accountNumber),
            bankName: parsed.bankName,
            ifscCode: encryptContractValue(parsed.ifscCode),
            accountType: parsed.accountType,
            branch: nullable(parsed.branch),
          },
          employmentDetails: {
            position: offer.position,
            department: offer.department,
            salary: offer.salary,
            startDate: offer.startDate,
            joiningLocation: offer.joiningLocation,
            workType: offer.workType,
            reportingManager: offer.reportingManager,
          },
          status: ContractStatus.UNDER_REVIEW,
          workflowStatus: {
            currentStage: WorkflowStageName.SUBMITTED,
            submittedAt: now,
            stages: {
              submitted: { completedAt: now, completedBy: offer.userId },
            },
          },
          agreementTerms: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
            acceptedAt: now,
            ipAddress: forwarded?.slice(0, 64) ?? null,
          },
          documents: uploaded.map((item) => ({
            documentType: item.documentType,
            fileName: item.fileName,
            fileUrl: item.url,
            cloudinaryPublicId: item.publicId,
          })),
        },
        select: { id: true, status: true, createdAt: true },
      });
      const linked = await transaction.offerLetter.updateMany({
        where: {
          id: offer.id,
          status: OfferStatus.PENDING,
          acceptanceToken: tokenDigest(token),
        },
        data: {
          contractId: created.id,
          acceptanceToken: null,
          status: OfferStatus.ACCEPTED,
          acceptedAt: now,
          rejectedAt: null,
          onboardingDraft: null,
          draftUpdatedAt: null,
          draftDocuments: [],
        },
      });
      if (linked.count !== 1)
        throw new ApiError(
          "Onboarding was already submitted in another request",
          409,
          "ONBOARDING_ALREADY_SUBMITTED",
        );
      if (offer.userId)
        await transaction.auditLog.create({
          data: {
            actor: offer.userId,
            actorRole: "USER",
            action: "CREATE",
            resourceEntity: "EmploymentContract",
            resourceId: created.id,
            changes: { status: created.status },
          },
        });
      return created;
    });
    return contract;
  } catch (error) {
    await Promise.all(
      newlyUploadedIds.map((publicId) => deletePrivateDocument(publicId)),
    );
    throw error;
  }
}

const contractListSelect = {
  id: true,
  candidateName: true,
  email: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
  employmentDetails: true,
} as const;

export async function listContracts(actor: RecruitmentActor) {
  const contracts = await prisma.employmentContract.findMany({
    orderBy: { createdAt: "desc" },
    select: { ...contractListSelect, application: { select: { jobId: true } } },
  });
  return contracts
    .filter(
      (item) =>
        !item.application ||
        actor.isAdministrator ||
        actor.assignedJobs.includes(item.application.jobId),
    )
    .map((item) => ({
      id: item.id,
      candidateName: item.candidateName,
      email: item.email,
      status: item.status,
      createdAt: item.createdAt,
      reviewedAt: item.reviewedAt,
      employmentDetails: item.employmentDetails,
    }));
}

async function contractForActor(id: string, actor: RecruitmentActor) {
  if (!objectIdPattern.test(id)) throw new ApiError("Contract not found", 404);
  const contract = await prisma.employmentContract.findUnique({
    where: { id },
    include: {
      application: { select: { jobId: true } },
      reviewer: { select: { name: true } },
    },
  });
  if (!contract) throw new ApiError("Contract not found", 404);
  if (contract.application)
    assertAssignedJob(actor, contract.application.jobId);
  return contract;
}

export async function getRedactedContract(id: string, actor: RecruitmentActor) {
  const item = await contractForActor(id, actor);
  return {
    id: item.id,
    candidateName: item.candidateName,
    email: item.email,
    phone: item.phone,
    status: item.status,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt,
    adminComments: item.adminComments,
    reviewerName: item.reviewer?.name ?? null,
    workflowStatus: item.workflowStatus,
    personalInfo: item.personalInfo
      ? {
          ...item.personalInfo,
          identificationDocuments: item.personalInfo.identificationDocuments
            ? {
                ...item.personalInfo.identificationDocuments,
                idNumber: maskSensitiveValue(
                  item.personalInfo.identificationDocuments.idNumber,
                ),
                documentUrl: undefined,
                cloudinaryPublicId: undefined,
              }
            : null,
        }
      : null,
    bankingInfo: item.bankingInfo
      ? {
          ...item.bankingInfo,
          accountNumber: maskSensitiveValue(item.bankingInfo.accountNumber),
          ifscCode: maskSensitiveValue(item.bankingInfo.ifscCode),
        }
      : null,
    employmentDetails: item.employmentDetails,
    agreementTerms: item.agreementTerms
      ? {
          termsAccepted: item.agreementTerms.termsAccepted,
          privacyPolicyAccepted: item.agreementTerms.privacyPolicyAccepted,
          acceptedAt: item.agreementTerms.acceptedAt,
        }
      : null,
    documents: item.documents.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      uploadedAt: document.uploadedAt,
    })),
  };
}

export async function transitionContractStatus(
  id: string,
  input: unknown,
  actor: RecruitmentActor,
) {
  const current = await contractForActor(id, actor);
  const parsed = contractStatusSchema.parse(input);
  if (!canTransitionContractStatus(current.status, parsed.status))
    throw new ApiError(
      `Cannot move contract from ${current.status} to ${parsed.status}`,
      409,
    );
  if (
    (parsed.status === ContractStatus.REJECTED ||
      parsed.status === ContractStatus.REQUIRES_CLARIFICATION) &&
    !parsed.comments
  )
    throw new ApiError("Comments are required for this status", 400);
  const now = new Date();
  const stage =
    parsed.status === ContractStatus.APPROVED
      ? WorkflowStageName.APPROVED
      : parsed.status === ContractStatus.REJECTED
        ? WorkflowStageName.REJECTED
        : parsed.status === ContractStatus.UNDER_REVIEW
          ? WorkflowStageName.UNDER_REVIEW
          : WorkflowStageName.REQUIRES_CHANGES;
  const result = await prisma.employmentContract.updateMany({
    where: { id, status: current.status },
    data: {
      status: parsed.status,
      reviewedBy: actor.id,
      reviewedAt: now,
      adminComments: nullable(parsed.comments),
      workflowStatus: {
        currentStage: stage,
        submittedAt: current.workflowStatus?.submittedAt ?? null,
        reviewedAt: now,
        approvedAt:
          parsed.status === ContractStatus.APPROVED
            ? now
            : (current.workflowStatus?.approvedAt ?? null),
        rejectedAt:
          parsed.status === ContractStatus.REJECTED
            ? now
            : (current.workflowStatus?.rejectedAt ?? null),
        stages: current.workflowStatus?.stages ?? null,
      },
    },
  });
  if (result.count !== 1)
    throw new ApiError("Contract changed; reload the page", 409);
  await prisma.auditLog.create({
    data: {
      actor: actor.id,
      actorRole: actor.role,
      action: "STATUS_CHANGE",
      resourceEntity: "EmploymentContract",
      resourceId: id,
      changes: {
        oldStatus: current.status,
        newStatus: parsed.status,
        reasonProvided: Boolean(parsed.comments),
      },
    },
  });
  return { status: parsed.status };
}

export async function contractDocumentUrl(
  contractId: string,
  documentId: string,
  actor: RecruitmentActor,
): Promise<string> {
  const contract = await contractForActor(contractId, actor);
  const document = contract.documents.find((item) => item.id === documentId);
  if (!document?.cloudinaryPublicId)
    throw new ApiError("Document not found", 404);
  await prisma.auditLog.create({
    data: {
      actor: actor.id,
      actorRole: actor.role,
      action: "DOWNLOAD",
      resourceEntity: "EmploymentContract",
      resourceId: contractId,
      changes: {},
    },
  });
  return privateDocumentDownloadUrl(document.cloudinaryPublicId);
}

export async function contractPdf(
  id: string,
  actor: RecruitmentActor,
): Promise<Uint8Array> {
  const item = await contractForActor(id, actor);
  const bankAccount = item.bankingInfo?.accountNumber
    ? maskSensitiveValue(item.bankingInfo.accountNumber)
    : null;
  const identity = item.personalInfo?.identificationDocuments?.idNumber
    ? maskSensitiveValue(item.personalInfo.identificationDocuments.idNumber)
    : null;
  const lines = [
    { label: "Candidate", value: item.candidateName },
    { label: "Email", value: item.email },
    ...(item.employmentDetails?.position
      ? [{ label: "Position", value: item.employmentDetails.position }]
      : []),
    ...(item.employmentDetails?.department
      ? [{ label: "Department", value: item.employmentDetails.department }]
      : []),
    ...(item.employmentDetails?.salary
      ? [{ label: "Compensation", value: item.employmentDetails.salary }]
      : []),
    ...(item.employmentDetails?.workType
      ? [
          {
            label: "Work arrangement",
            value: item.employmentDetails.workType.replace("_", " "),
          },
        ]
      : []),
    ...(identity ? [{ label: "Identity number", value: identity }] : []),
    ...(bankAccount ? [{ label: "Bank account", value: bankAccount }] : []),
    { label: "Status", value: item.status.replaceAll("_", " ") },
    {
      value:
        "Sensitive identity and banking values are intentionally masked in this document.",
    },
  ];
  await prisma.auditLog.create({
    data: {
      actor: actor.id,
      actorRole: actor.role,
      action: "DOWNLOAD",
      resourceEntity: "EmploymentContract",
      resourceId: id,
      changes: {},
    },
  });
  return renderDocumentPdf(
    "Employment Contract",
    `Contract ID: ${item.id}`,
    lines,
  );
}
