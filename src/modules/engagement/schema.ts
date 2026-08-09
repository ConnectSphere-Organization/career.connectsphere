import { AnalyticsEventName } from "@prisma/client";
import { z } from "zod";

export const applicationDraftSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
  payload: z.record(z.string(), z.unknown()),
  currentStep: z.number().int().min(0).max(20).default(0),
});

export const analyticsEventSchema = z.object({
  name: z.enum(AnalyticsEventName),
  anonymousId: z.string().trim().max(100).optional(),
  jobId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  applicationId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  sessionId: z.string().trim().max(100).optional(),
  source: z.string().trim().max(120).optional(),
  medium: z.string().trim().max(120).optional(),
  campaign: z.string().trim().max(160).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
