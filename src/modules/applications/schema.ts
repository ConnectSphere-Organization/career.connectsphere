import { z } from "zod";

export const applicationAnswerSchema = z.union([
  z.string().trim().max(5_000),
  z.array(z.string().trim().max(500)).max(50),
  z.number().int().min(1).max(10),
]);

export const applicationFieldsSchema = z.object({
  jobIdentifier: z.string().trim().min(1).max(200),
  referralId: z
    .union([z.literal(""), z.string().regex(/^[a-f\d]{24}$/i)])
    .default(""),
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid international phone number"),
  experience: z.string().trim().max(5_000),
  education: z.string().trim().max(5_000),
  skills: z.string().trim().min(1, "Add at least one skill").max(2_000),
  coverLetter: z
    .string()
    .trim()
    .min(20, "Cover letter must be at least 20 characters")
    .max(10_000),
  questionAnswers: z.record(z.string(), applicationAnswerSchema),
  privacyConsentAccepted: z.literal(true, {
    error: "Accept the candidate privacy notice to submit",
  }),
  privacyPolicyVersion: z.string().trim().min(1).max(40),
});

export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;
