import { z } from "zod";

const requiredDate = z.iso.date("Enter a valid date");
const optionalText = (maximum: number) => z.string().trim().max(maximum);

export const certificateInputSchema = z
  .object({
    jobId: z.string().regex(/^[a-f\d]{24}$/i, "Select an authorized job"),
    name: z.string().trim().min(2).max(120),
    recipientEmail: z.union([z.literal(""), z.email().max(254)]),
    domain: z.string().trim().min(2).max(120),
    jobrole: z.string().trim().min(2).max(120),
    fromDate: requiredDate,
    toDate: requiredDate,
    issuedBy: z.string().trim().min(2).max(120),
  })
  .refine((value) => value.toDate >= value.fromDate, {
    message: "End date must be on or after start date",
    path: ["toDate"],
  });

export type CertificateInput = z.infer<typeof certificateInputSchema>;

export const offerInputSchema = z
  .object({
    candidateName: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    position: z.string().trim().min(2).max(120),
    department: z.string().trim().min(2).max(120),
    salary: z.string().trim().min(1).max(120),
    offerType: z.enum(["JOB", "INTERNSHIP"]),
    payoutFrequency: optionalText(60),
    startDate: requiredDate,
    endDate: z.union([z.literal(""), requiredDate]),
    duration: optionalText(80),
    joiningLocation: optionalText(200),
    workType: z.enum(["REMOTE", "ON_SITE", "HYBRID"]),
    benefits: z.string().trim().max(2_000),
    reportingManager: optionalText(120),
    companyName: z.string().trim().min(2).max(120),
    hrContactName: optionalText(120),
    hrContactEmail: z.union([z.literal(""), z.email().max(254)]),
    hrContactPhone: optionalText(30),
    issuedBy: z.string().trim().min(2).max(120),
    validUntil: requiredDate,
    additionalNotes: optionalText(5_000),
    applicationId: z.string().trim().max(200),
  })
  .refine(
    (value) => value.validUntil >= new Date().toISOString().slice(0, 10),
    { message: "Validity date cannot be in the past", path: ["validUntil"] },
  )
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type OfferInput = z.infer<typeof offerInputSchema>;

export const offerDecisionSchema = z.object({
  decision: z.enum(["ACCEPTED", "REJECTED"]),
  comments: z.string().trim().max(2_000),
});

export type OfferDecisionInput = z.infer<typeof offerDecisionSchema>;

export const offerExtensionSchema = z
  .object({
    validUntil: requiredDate,
    startDate: requiredDate.optional(),
    notes: z.string().trim().min(3).max(1_000),
  })
  .refine(
    (value) => value.validUntil >= new Date().toISOString().slice(0, 10),
    { message: "Validity date cannot be in the past", path: ["validUntil"] },
  );

export const offerStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
  reason: z.string().trim().min(3).max(1_000),
});
