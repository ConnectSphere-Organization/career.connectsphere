import { RecommendationStatus, ReviewStatus, WorkType } from "@prisma/client";
import { z } from "zod";

const referralCommon = {
  message: z
    .string()
    .trim()
    .min(20, "Explain why this person is a strong fit")
    .max(1500),
  relationship: z.string().trim().min(2).max(120),
  consentConfirmed: z.literal(true, {
    error: "Confirm that the candidate knows their details are being shared",
  }),
};

export const recommendationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("EXISTING_APPLICATION"),
    applicationId: z.string().regex(/^[a-f\d]{24}$/i),
    ...referralCommon,
  }),
  z.object({
    kind: z.literal("NEW_CANDIDATE"),
    jobId: z.string().regex(/^[a-f\d]{24}$/i),
    candidateName: z.string().trim().min(2).max(120),
    candidateEmail: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    candidatePhone: z.string().trim().max(30),
    ...referralCommon,
  }),
]);

export const recommendationModerationSchema = z
  .object({
    status: z.enum(RecommendationStatus).exclude(["PENDING"]),
    adminNotes: z.string().trim().max(1000).nullable(),
  })
  .superRefine((value, context) => {
    if (value.status === "REJECTED" && !value.adminNotes)
      context.addIssue({
        code: "custom",
        path: ["adminNotes"],
        message: "A rejection reason is required",
      });
  });

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  content: z.string().trim().min(20).max(3000),
  department: z.string().trim().max(100).nullable(),
  position: z.string().trim().max(100).nullable(),
  workType: z.enum(WorkType).nullable(),
  employmentDuration: z.string().trim().max(100).nullable(),
  pros: z.string().trim().max(1000).nullable(),
  cons: z.string().trim().max(1000).nullable(),
  advice: z.string().trim().max(1000).nullable(),
  isAnonymous: z.boolean(),
});

export const reviewModerationSchema = z
  .object({
    status: z.enum(ReviewStatus).exclude(["PENDING"]),
    moderatorNotes: z.string().trim().max(1000).nullable(),
    rejectionReason: z.string().trim().max(1000).nullable(),
  })
  .superRefine((value, context) => {
    if (value.status === "REJECTED" && !value.rejectionReason)
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required",
      });
  });
