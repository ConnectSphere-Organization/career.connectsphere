import {
  ApprovalStatus,
  AssetCategory,
  AssetStatus,
  AttendanceSource,
  AttendanceStatus,
  ControlledDocumentType,
  DocumentStatus,
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
  LeaveType,
  BonusType,
  DeductionType,
  ReimbursementCategory,
  SettlementStatus,
  TerminationType,
} from "@prisma/client";
import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid record identifier");
const date = z.coerce.date();

export const attendanceInputSchema = z.object({
  employeeId: objectId,
  date,
  status: z.enum(AttendanceStatus),
  checkIn: date.optional(),
  checkOut: date.optional(),
  source: z.enum(AttendanceSource).default(AttendanceSource.MANUAL),
  notes: z.string().trim().max(1_000).optional(),
});

export const leaveRequestInputSchema = z.object({
  employeeId: objectId,
  leaveType: z.enum(LeaveType),
  startsAt: date,
  endsAt: date,
  days: z.number().positive().max(365),
  reason: z.string().trim().min(3).max(2_000),
});

export const reviewInputSchema = z.object({
  id: objectId,
  status: z
    .enum(ApprovalStatus)
    .refine((value) => value !== ApprovalStatus.PENDING),
  note: z.string().trim().max(2_000).optional(),
});

export const payrollRunInputSchema = z.object({
  code: z.string().trim().min(3).max(80),
  periodStart: date,
  periodEnd: date,
  payDate: date,
  currency: z.string().trim().length(3).default("INR"),
});

export const salaryStructureInputSchema = z.object({
  employeeId: objectId,
  name: z.string().trim().min(2).max(160),
  currency: z.string().trim().length(3).default("INR"),
  annualCtc: z.number().nonnegative(),
  monthlyGross: z.number().nonnegative(),
  components: z.record(z.string(), z.number().nonnegative()),
  effectiveFrom: date,
  effectiveUntil: date.optional(),
});

export const deductionInputSchema = z.object({
  employeeId: objectId,
  type: z.enum(DeductionType),
  label: z.string().trim().min(2).max(160),
  amount: z.number().positive(),
  effectiveOn: date,
  recurring: z.boolean().default(false),
});

export const bonusInputSchema = z.object({
  employeeId: objectId,
  type: z.enum(BonusType),
  label: z.string().trim().min(2).max(160),
  amount: z.number().positive(),
  effectiveOn: date,
});

export const reimbursementInputSchema = z.object({
  employeeId: objectId,
  category: z.enum(ReimbursementCategory),
  amount: z.number().positive(),
  currency: z.string().trim().length(3).default("INR"),
  expenseDate: date,
  description: z.string().trim().min(3).max(2_000),
  receiptUrl: z.url().optional(),
});

export const finalSettlementInputSchema = z.object({
  employeeId: objectId,
  exitChecklistId: objectId.optional(),
  currency: z.string().trim().length(3).default("INR"),
  salaryPayable: z.number().nonnegative().default(0),
  leaveEncashment: z.number().nonnegative().default(0),
  gratuity: z.number().nonnegative().default(0),
  bonus: z.number().nonnegative().default(0),
  reimbursements: z.number().nonnegative().default(0),
  recoveries: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  components: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(SettlementStatus).default(SettlementStatus.DRAFT),
});

export const resignationInputSchema = z.object({
  employeeId: objectId,
  requestedLastDay: date,
  reason: z.string().trim().min(3).max(3_000),
  noticeDays: z.number().int().min(0).max(365),
});

export const terminationInputSchema = z.object({
  employeeId: objectId,
  type: z.enum(TerminationType),
  reason: z.string().trim().min(3).max(3_000),
  effectiveDate: date,
  noticeDays: z.number().int().min(0).max(365).default(0),
});

export const assetInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    assetTag: z.string().trim().min(2).max(80),
    name: z.string().trim().min(2).max(160),
    category: z.enum(AssetCategory),
    serialNumber: z.string().trim().max(160).optional(),
  }),
  z.object({
    action: z.literal("assign"),
    id: objectId,
    employeeId: objectId,
    expectedReturnAt: date.optional(),
    condition: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("return"),
    id: objectId,
    condition: z.string().trim().max(500).optional(),
    status: z.enum(AssetStatus).default(AssetStatus.RETURNED),
  }),
]);

export const generatedDocumentInputSchema = z.object({
  employeeId: objectId.optional(),
  applicationId: objectId.optional(),
  templateId: objectId.optional(),
  type: z.enum(ControlledDocumentType),
  title: z.string().trim().min(2).max(200),
  expiresAt: date.optional(),
  snapshot: z.record(z.string(), z.unknown()),
});

export const documentStatusInputSchema = z.object({
  id: objectId,
  status: z.enum(DocumentStatus),
  reason: z.string().trim().max(1_000).optional(),
});

export const interviewRoundInputSchema = z.object({
  applicationId: objectId,
  jobId: objectId,
  sequence: z.number().int().min(1).max(50),
  name: z.string().trim().min(2).max(160),
  type: z.enum(InterviewType),
  scheduledStart: date,
  scheduledEnd: date,
  timezone: z.string().trim().min(1).max(80).default("Asia/Kolkata"),
  location: z.string().trim().max(300).optional(),
  meetingUrl: z.url().optional(),
  interviewerIds: z.array(objectId).min(1).max(20),
  scorecard: z.record(z.string(), z.unknown()).default({}),
});

export const interviewFeedbackInputSchema = z.object({
  interviewRoundId: objectId,
  interviewerId: objectId,
  scores: z.record(z.string(), z.number().min(1).max(10)),
  strengths: z.string().trim().max(3_000).optional(),
  concerns: z.string().trim().max(3_000).optional(),
  recommendation: z.enum(InterviewRecommendation),
});

export const interviewStatusInputSchema = z.object({
  id: objectId,
  status: z.enum(InterviewStatus),
});

export type OperationsDomain =
  | "attendance"
  | "leave"
  | "salary"
  | "payroll"
  | "deduction"
  | "bonus"
  | "reimbursement"
  | "settlement"
  | "resignation"
  | "termination"
  | "asset"
  | "document"
  | "interview";
