import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";

export const applicationStatusInputSchema = z.object({
  status: z.enum(ApplicationStatus),
});

export type ApplicationStatusInput = z.infer<
  typeof applicationStatusInputSchema
>;

