import { EmploymentType } from "@prisma/client";
import { z } from "zod";

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional().default("");

export const jobQuestionSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .nullable()
      .optional(),
    questionText: z
      .string()
      .trim()
      .min(2, "Question text is required")
      .max(500),
    questionType: z.enum([
      "TEXT",
      "MULTIPLE_CHOICE",
      "CHECKBOX",
      "FILE",
      "RATING",
    ]),
    required: z.boolean(),
    options: z.array(z.string().trim().min(1).max(200)).max(30),
    maxRating: z.number().int().min(2).max(10),
    order: z.number().int().min(0).max(99),
  })
  .superRefine((question, context) => {
    if (
      ["MULTIPLE_CHOICE", "CHECKBOX"].includes(question.questionType) &&
      question.options.length < 2
    ) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Choice questions require at least two options",
      });
    }
  });

export const jobInputSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  company: z.string().trim().min(2, "Company is required").max(160),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(20_000),
  requirements: z.array(z.string().trim().min(1).max(500)).max(100),
  responsibilities: z.array(z.string().trim().min(1).max(500)).max(100),
  location: optionalText(200),
  type: z.enum(EmploymentType).nullable(),
  salary: optionalText(120),
  department: optionalText(120),
  position: optionalText(160),
  reportingManager: optionalText(160),
  requisitionId: optionalText(80),
  headcount: z.number().int().min(1).max(10_000).default(1),
  applicationDeadline: optionalText(10),
  publishAt: optionalText(16),
  unpublishAt: optionalText(16),
  archived: z.boolean().default(false),
  isActive: z.boolean(),
  isPublished: z.boolean(),
  hrContact: z.object({
    name: optionalText(120),
    email: z.union([z.literal(""), z.email("Enter a valid HR email").max(254)]),
    phone: optionalText(30),
  }),
  questions: z.array(jobQuestionSchema).max(30).default([]),
});

export type JobInput = z.infer<typeof jobInputSchema>;

export const emptyJobInput: JobInput = {
  title: "",
  company: "ConnectSphere",
  description: "",
  requirements: [],
  responsibilities: [],
  location: "",
  type: EmploymentType.FULL_TIME,
  salary: "",
  department: "",
  position: "",
  reportingManager: "",
  requisitionId: "",
  headcount: 1,
  applicationDeadline: "",
  publishAt: "",
  unpublishAt: "",
  archived: false,
  isActive: true,
  isPublished: false,
  hrContact: { name: "", email: "", phone: "" },
  questions: [],
};
