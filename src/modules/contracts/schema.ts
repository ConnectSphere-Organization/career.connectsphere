import { ContractStatus } from "@prisma/client";
import { z } from "zod";

const text = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);
const optionalText = (maximum: number) => z.string().trim().max(maximum);

export const contractSubmissionSchema = z.object({
  phone: text(7, 30),
  dateOfBirth: z.iso.date("Enter a valid date of birth"),
  nationality: text(2, 80),
  street: text(3, 200),
  city: text(2, 100),
  state: text(2, 100),
  zipCode: text(3, 20),
  country: text(2, 80),
  emergencyName: text(2, 120),
  emergencyRelationship: text(2, 80),
  emergencyPhone: text(7, 30),
  emergencyEmail: z.union([z.literal(""), z.email().max(254)]),
  idType: z.enum(["AADHAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID"]),
  idNumber: text(4, 80),
  accountHolderName: text(2, 120),
  accountNumber: text(4, 80),
  bankName: text(2, 120),
  ifscCode: text(4, 30),
  accountType: z.enum(["SAVINGS", "CURRENT"]),
  branch: optionalText(120),
  position: text(2, 120),
  department: text(2, 120),
  salary: text(1, 120),
  startDate: z.iso.date("Enter a valid start date"),
  joiningLocation: optionalText(200),
  workType: z.enum(["REMOTE", "ON_SITE", "HYBRID"]),
  reportingManager: optionalText(120),
  termsAccepted: z.literal(true, {
    error: "Employment terms must be accepted",
  }),
  privacyPolicyAccepted: z.literal(true, {
    error: "Privacy policy must be accepted",
  }),
});

export type ContractSubmissionInput = z.infer<typeof contractSubmissionSchema>;

const draftText = z.string().trim().max(200);

export const contractDraftSchema = z.object({
  phone: draftText.optional(),
  dateOfBirth: z.union([z.literal(""), z.iso.date()]).optional(),
  nationality: draftText.optional(),
  street: draftText.optional(),
  city: draftText.optional(),
  state: draftText.optional(),
  zipCode: draftText.optional(),
  country: draftText.optional(),
  emergencyName: draftText.optional(),
  emergencyRelationship: draftText.optional(),
  emergencyPhone: draftText.optional(),
  emergencyEmail: z.union([z.literal(""), z.email().max(254)]).optional(),
  idType: z
    .enum(["AADHAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID"])
    .optional(),
  idNumber: draftText.optional(),
  accountHolderName: draftText.optional(),
  accountNumber: draftText.optional(),
  bankName: draftText.optional(),
  ifscCode: draftText.optional(),
  accountType: z.enum(["SAVINGS", "CURRENT"]).optional(),
  branch: draftText.optional(),
  position: draftText.optional(),
  department: draftText.optional(),
  salary: draftText.optional(),
  startDate: z.union([z.literal(""), z.iso.date()]).optional(),
  joiningLocation: draftText.optional(),
  workType: z.enum(["REMOTE", "ON_SITE", "HYBRID"]).optional(),
  reportingManager: draftText.optional(),
  termsAccepted: z.boolean().optional(),
  privacyPolicyAccepted: z.boolean().optional(),
  currentStep: z.number().int().min(0).max(3).default(0),
});

export type ContractDraftInput = z.infer<typeof contractDraftSchema>;

export const contractStatusSchema = z.object({
  status: z.enum(ContractStatus),
  comments: z.string().trim().max(2_000),
});

const transitions: Readonly<Record<ContractStatus, readonly ContractStatus[]>> =
  {
    DRAFT: [ContractStatus.UNDER_REVIEW],
    UNDER_REVIEW: [
      ContractStatus.APPROVED,
      ContractStatus.REJECTED,
      ContractStatus.REQUIRES_CLARIFICATION,
    ],
    REQUIRES_CLARIFICATION: [
      ContractStatus.UNDER_REVIEW,
      ContractStatus.REJECTED,
    ],
    APPROVED: [],
    REJECTED: [],
  };

export function allowedContractStatusTransitions(
  status: ContractStatus,
): readonly ContractStatus[] {
  return transitions[status];
}

export function canTransitionContractStatus(
  current: ContractStatus,
  next: ContractStatus,
): boolean {
  return transitions[current].includes(next);
}
