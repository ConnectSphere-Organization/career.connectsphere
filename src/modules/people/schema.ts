import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

import { capabilityKeys } from "@/lib/auth/policy";

export const employeeImportRowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  employeeId: z.string().trim().min(1).max(60),
  department: z.string().trim().min(1).max(120),
  position: z.string().trim().min(1).max(120),
  positionLevel: z
    .enum(["JUNIOR", "SENIOR", "LEAD", "MANAGER", "DIRECTOR"])
    .default("JUNIOR"),
  reportingManager: z.string().trim().max(120).default(""),
  phoneNumber: z.string().trim().max(30).default(""),
});

export const peopleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).default(""),
  role: z.enum(UserRole).optional(),
  status: z.enum(UserStatus).optional(),
  view: z.enum(["users", "employees"]).default("users"),
});

export const lifecycleSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("profile"),
    status: z.enum(UserStatus),
    department: z.string().trim().max(100).nullable(),
    position: z.string().trim().max(100).nullable(),
    positionLevel: z.enum(["JUNIOR", "SENIOR", "LEAD", "MANAGER", "DIRECTOR"]),
  }),
  z.object({
    operation: z.literal("terminate"),
    reason: z.string().trim().min(3).max(500),
  }),
  z.object({ operation: z.literal("role"), role: z.enum(UserRole) }),
]);

export const bulkPeopleActionSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("status"),
    userIds: z
      .array(z.string().regex(/^[a-f\d]{24}$/i))
      .min(1)
      .max(100),
    status: z.enum(UserStatus),
  }),
]);

export const permissionKeys = capabilityKeys;

export const defaultHrPermissions = {
  canGenerateCertificate: true,
  canGenerateOfferLetter: true,
  canCreateJob: true,
  canManageJobs: true,
  canViewApplicants: true,
  canManageReviews: true,
  canManageEmployees: false,
  canManageRecommendations: true,
  canManageCandidateCollaboration: true,
  canManageCommunications: true,
  canAccessDashboard: true,
  canManageInterviews: true,
  canManageAttendance: true,
  canManageLeave: true,
  canManagePayroll: false,
  canManageExits: true,
  canManageDocuments: true,
  canVerifyDocuments: false,
  canManagePrivacy: true,
  canManageIntegrations: false,
  canViewReports: true,
} as const;

export const hrGrantSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  permissions: z.object(
    Object.fromEntries(
      permissionKeys.map((key) => [key, z.boolean()]),
    ) as Record<(typeof permissionKeys)[number], z.ZodBoolean>,
  ),
  assignedJobs: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(200),
});

export const hrUpdateSchema = hrGrantSchema.omit({ userId: true });

export type PeopleQuery = z.infer<typeof peopleQuerySchema>;
export type HrGrantInput = z.infer<typeof hrGrantSchema>;
