import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  AssetStatus,
  DocumentStatus,
  PayrollRunStatus,
  type Prisma,
} from "@prisma/client";
import QRCode from "qrcode";

import { recordAudit } from "@/lib/audit/audit";
import type { CollaborationActor } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";
import {
  assetInputSchema,
  attendanceInputSchema,
  bonusInputSchema,
  deductionInputSchema,
  documentStatusInputSchema,
  finalSettlementInputSchema,
  generatedDocumentInputSchema,
  interviewFeedbackInputSchema,
  interviewRoundInputSchema,
  interviewStatusInputSchema,
  leaveRequestInputSchema,
  payrollRunInputSchema,
  reimbursementInputSchema,
  resignationInputSchema,
  reviewInputSchema,
  salaryStructureInputSchema,
  terminationInputSchema,
} from "@/modules/operations/schema";

const employeeSummary = {
  id: true,
  employeeCode: true,
  user: { select: { name: true, email: true } },
  department: { select: { name: true } },
  designation: { select: { name: true } },
} satisfies Prisma.EmployeeSelect;

export async function getOperationsDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [
    employees,
    attendanceToday,
    pendingLeave,
    openPayroll,
    activeExits,
    assignedAssets,
    validDocuments,
    upcomingInterviews,
    leaveRequests,
    payrollRuns,
    exitRecords,
    interviews,
    actionEmployees,
  ] = await Promise.all([
    prisma.employee.count({
      where: { employmentStatus: { in: ["ACTIVE", "ON_LEAVE", "NOTICE"] } },
    }),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.payrollRun.count({
      where: { status: { in: ["DRAFT", "CALCULATING", "REVIEW", "APPROVED"] } },
    }),
    prisma.exitChecklist.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
    }),
    prisma.asset.count({
      where: { status: { in: ["ASSIGNED", "RETURN_DUE"] } },
    }),
    prisma.generatedDocument.count({
      where: {
        status: "VALID",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.interviewRound.count({
      where: {
        scheduledStart: { gte: now },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    }),
    prisma.leaveRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { employee: { select: employeeSummary } },
    }),
    prisma.payrollRun.findMany({
      orderBy: { periodStart: "desc" },
      take: 8,
      select: {
        id: true,
        code: true,
        periodStart: true,
        periodEnd: true,
        payDate: true,
        status: true,
        totalNet: true,
        currency: true,
      },
    }),
    prisma.exitChecklist.findMany({
      orderBy: { targetExitDate: "asc" },
      take: 8,
      include: { employee: { select: employeeSummary } },
    }),
    prisma.interviewRound.findMany({
      where: { scheduledStart: { gte: monthStart } },
      orderBy: { scheduledStart: "asc" },
      take: 10,
      include: {
        application: { select: { fullName: true, email: true } },
        job: { select: { title: true } },
        _count: { select: { feedback: true } },
      },
    }),
    prisma.employee.findMany({
      where: { employmentStatus: { in: ["ACTIVE", "ON_LEAVE", "NOTICE"] } },
      orderBy: { employeeCode: "asc" },
      take: 200,
      select: {
        id: true,
        employeeCode: true,
        user: { select: { name: true, email: true } },
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    }),
  ]);

  return {
    metrics: {
      employees,
      attendanceToday,
      pendingLeave,
      openPayroll,
      activeExits,
      assignedAssets,
      validDocuments,
      upcomingInterviews,
    },
    leaveRequests,
    payrollRuns,
    exitRecords,
    interviews,
    actionEmployees,
  };
}

export async function listOperationsDomain(domain: string) {
  switch (domain) {
    case "attendance":
      return prisma.attendance.findMany({
        orderBy: { date: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "leave":
      return prisma.leaveRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "salary":
      return prisma.salaryStructure.findMany({
        orderBy: { effectiveFrom: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "payroll":
      return prisma.payrollRun.findMany({
        orderBy: { periodStart: "desc" },
        take: 100,
        include: { _count: { select: { payslips: true } } },
      });
    case "deduction":
      return prisma.deduction.findMany({
        orderBy: { effectiveOn: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "bonus":
      return prisma.bonus.findMany({
        orderBy: { effectiveOn: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "reimbursement":
      return prisma.reimbursement.findMany({
        orderBy: { expenseDate: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "settlement":
      return prisma.finalSettlement.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "resignation":
      return prisma.resignation.findMany({
        orderBy: { submittedAt: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "termination":
      return prisma.termination.findMany({
        orderBy: { effectiveDate: "desc" },
        take: 100,
        include: { employee: { select: employeeSummary } },
      });
    case "asset":
      return prisma.asset.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: { assignedEmployee: { select: employeeSummary } },
      });
    case "document":
      return prisma.generatedDocument.findMany({
        orderBy: { issuedAt: "desc" },
        take: 100,
        include: {
          employee: { select: employeeSummary },
          template: { select: { name: true, version: true } },
        },
      });
    case "interview":
      return prisma.interviewRound.findMany({
        orderBy: { scheduledStart: "desc" },
        take: 100,
        include: {
          application: { select: { fullName: true, email: true } },
          job: { select: { title: true } },
          _count: { select: { feedback: true } },
        },
      });
    default:
      throw new ApiError("Unknown operations domain", 404);
  }
}

export async function recordAttendance(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = attendanceInputSchema.parse(raw);
  if (input.checkIn && input.checkOut && input.checkOut <= input.checkIn)
    throw new ApiError("Check-out must be after check-in", 400);
  const workedMinutes =
    input.checkIn && input.checkOut
      ? Math.max(
          0,
          Math.round(
            (input.checkOut.getTime() - input.checkIn.getTime()) / 60_000,
          ),
        )
      : 0;
  const attendance = await prisma.attendance.upsert({
    where: {
      employeeId_date: { employeeId: input.employeeId, date: input.date },
    },
    create: {
      ...input,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      notes: input.notes ?? null,
      workedMinutes,
    },
    update: {
      status: input.status,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      source: input.source,
      notes: input.notes ?? null,
      workedMinutes,
      regularizedBy: actor.id,
    },
  });
  await recordAudit({
    actor,
    action: "UPDATE",
    resourceEntity: "Attendance",
    resourceId: attendance.id,
    changes: {
      employeeId: input.employeeId,
      date: input.date.toISOString(),
      status: input.status,
    },
  });
  return attendance;
}

export async function createLeaveRequest(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = leaveRequestInputSchema.parse(raw);
  if (input.endsAt < input.startsAt)
    throw new ApiError(
      "Leave end date must be on or after the start date",
      400,
    );
  const leave = await prisma.leaveRequest.create({ data: input });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "LeaveRequest",
    resourceId: leave.id,
    changes: {
      employeeId: input.employeeId,
      days: input.days,
      leaveType: input.leaveType,
    },
  });
  return leave;
}

export async function reviewLeaveRequest(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = reviewInputSchema.parse(raw);
  const result = await prisma.leaveRequest.updateMany({
    where: { id: input.id, status: "PENDING" },
    data: {
      status: input.status,
      approverId: actor.id,
      reviewedAt: new Date(),
      reviewerNote: input.note ?? null,
    },
  });
  if (result.count !== 1)
    throw new ApiError("Pending leave request not found", 404);
  await recordAudit({
    actor,
    action: "STATUS_CHANGE",
    resourceEntity: "LeaveRequest",
    resourceId: input.id,
    changes: { status: input.status },
  });
  return { id: input.id, status: input.status };
}

export async function createSalaryStructure(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = salaryStructureInputSchema.parse(raw);
  const salary = await prisma.$transaction(async (tx) => {
    await tx.salaryStructure.updateMany({
      where: { employeeId: input.employeeId, status: "ACTIVE" },
      data: {
        status: "INACTIVE",
        effectiveUntil: new Date(input.effectiveFrom.getTime() - 1),
      },
    });
    return tx.salaryStructure.create({
      data: {
        ...input,
        effectiveUntil: input.effectiveUntil ?? null,
        components: input.components as Prisma.InputJsonValue,
        approvedBy: actor.id,
      },
    });
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "SalaryStructure",
    resourceId: salary.id,
    changes: {
      employeeId: input.employeeId,
      currency: input.currency,
      effectiveFrom: input.effectiveFrom.toISOString(),
    },
  });
  return salary;
}

export async function createDeduction(raw: unknown, actor: CollaborationActor) {
  const input = deductionInputSchema.parse(raw);
  const item = await prisma.deduction.create({
    data: { ...input, status: "APPROVED", approvedBy: actor.id },
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "Deduction",
    resourceId: item.id,
    changes: { employeeId: input.employeeId, type: input.type },
  });
  return item;
}

export async function createBonus(raw: unknown, actor: CollaborationActor) {
  const input = bonusInputSchema.parse(raw);
  const item = await prisma.bonus.create({
    data: { ...input, status: "APPROVED", approvedBy: actor.id },
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "Bonus",
    resourceId: item.id,
    changes: { employeeId: input.employeeId, type: input.type },
  });
  return item;
}

export async function createReimbursement(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = reimbursementInputSchema.parse(raw);
  const item = await prisma.reimbursement.create({
    data: { ...input, receiptUrl: input.receiptUrl ?? null },
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "Reimbursement",
    resourceId: item.id,
    changes: { employeeId: input.employeeId, category: input.category },
  });
  return item;
}

export async function reviewReimbursement(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = reviewInputSchema.parse(raw);
  const result = await prisma.reimbursement.updateMany({
    where: { id: input.id, status: "PENDING" },
    data: {
      status: input.status,
      approvedBy: actor.id,
      reviewedAt: new Date(),
    },
  });
  if (result.count !== 1)
    throw new ApiError("Pending reimbursement not found", 404);
  await recordAudit({
    actor,
    action: "STATUS_CHANGE",
    resourceEntity: "Reimbursement",
    resourceId: input.id,
    changes: { status: input.status },
  });
  return { id: input.id, status: input.status };
}

export async function createFinalSettlement(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = finalSettlementInputSchema.parse(raw);
  const earnings =
    input.salaryPayable +
    input.leaveEncashment +
    input.gratuity +
    input.bonus +
    input.reimbursements;
  const netPayable = Math.max(0, earnings - input.recoveries - input.tax);
  const settlement = await prisma.finalSettlement.create({
    data: {
      employeeId: input.employeeId,
      exitChecklistId: input.exitChecklistId ?? null,
      currency: input.currency,
      salaryPayable: input.salaryPayable,
      leaveEncashment: input.leaveEncashment,
      gratuity: input.gratuity,
      bonus: input.bonus,
      reimbursements: input.reimbursements,
      recoveries: input.recoveries,
      tax: input.tax,
      netPayable,
      components: input.components as Prisma.InputJsonValue,
      status: input.status,
      ...(input.status === "APPROVED"
        ? { approvedBy: actor.id, approvedAt: new Date() }
        : {}),
    },
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "FinalSettlement",
    resourceId: settlement.id,
    changes: {
      employeeId: input.employeeId,
      status: settlement.status,
      netPayable,
      currency: input.currency,
    },
  });
  return settlement;
}

export async function createPayrollRun(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = payrollRunInputSchema.parse(raw);
  if (input.periodEnd < input.periodStart)
    throw new ApiError("Payroll period end must be after the start", 400);
  const result = await prisma.$transaction(async (tx) => {
    const run = await tx.payrollRun.create({
      data: {
        ...input,
        createdBy: actor.id,
        status: PayrollRunStatus.CALCULATING,
      },
    });
    const [structures, deductions, bonuses, reimbursements] = await Promise.all(
      [
        tx.salaryStructure.findMany({
          where: {
            status: "ACTIVE",
            effectiveFrom: { lte: input.periodEnd },
            OR: [
              { effectiveUntil: null },
              { effectiveUntil: { gte: input.periodStart } },
            ],
          },
          orderBy: { effectiveFrom: "desc" },
        }),
        tx.deduction.findMany({
          where: {
            status: "APPROVED",
            effectiveOn: { gte: input.periodStart, lte: input.periodEnd },
          },
        }),
        tx.bonus.findMany({
          where: {
            status: "APPROVED",
            effectiveOn: { gte: input.periodStart, lte: input.periodEnd },
          },
        }),
        tx.reimbursement.findMany({
          where: {
            status: "APPROVED",
            expenseDate: { gte: input.periodStart, lte: input.periodEnd },
          },
        }),
      ],
    );
    const latest = new Map<string, (typeof structures)[number]>();
    for (const structure of structures)
      if (!latest.has(structure.employeeId))
        latest.set(structure.employeeId, structure);
    let totalGross = 0;
    let totalDeduction = 0;
    let totalNet = 0;
    for (const structure of latest.values()) {
      const employeeDeductions = deductions.filter(
        (item) => item.employeeId === structure.employeeId,
      );
      const employeeBonuses = bonuses.filter(
        (item) => item.employeeId === structure.employeeId,
      );
      const employeeReimbursements = reimbursements.filter(
        (item) => item.employeeId === structure.employeeId,
      );
      const deductionAmount = employeeDeductions.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const bonusAmount = employeeBonuses.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const reimbursementAmount = employeeReimbursements.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const netAmount = Math.max(
        0,
        structure.monthlyGross -
          deductionAmount +
          bonusAmount +
          reimbursementAmount,
      );
      const payslip = await tx.payslip.create({
        data: {
          payrollRunId: run.id,
          employeeId: structure.employeeId,
          salaryStructureId: structure.id,
          currency: input.currency,
          grossAmount: structure.monthlyGross,
          deductionAmount,
          bonusAmount,
          reimbursementAmount,
          netAmount,
          lineItems: {
            earnings: structure.components,
            deductions: employeeDeductions.map(({ label, amount }) => ({
              label,
              amount,
            })),
            bonuses: employeeBonuses.map(({ label, amount }) => ({
              label,
              amount,
            })),
            reimbursements: employeeReimbursements.map(
              ({ category, amount }) => ({ label: category, amount }),
            ),
          },
          status: "DRAFT",
        },
      });
      await Promise.all([
        ...employeeDeductions.map((item) =>
          tx.deduction.update({
            where: { id: item.id },
            data: { payslipId: payslip.id },
          }),
        ),
        ...employeeBonuses.map((item) =>
          tx.bonus.update({
            where: { id: item.id },
            data: { payslipId: payslip.id },
          }),
        ),
        ...employeeReimbursements.map((item) =>
          tx.reimbursement.update({
            where: { id: item.id },
            data: { payslipId: payslip.id },
          }),
        ),
      ]);
      totalGross += structure.monthlyGross;
      totalDeduction += deductionAmount;
      totalNet += netAmount;
    }
    return tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: PayrollRunStatus.REVIEW,
        totalGross,
        totalDeduction,
        totalNet,
      },
      include: { _count: { select: { payslips: true } } },
    });
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "PayrollRun",
    resourceId: result.id,
    changes: { code: result.code, payslipCount: result._count.payslips },
  });
  return result;
}

export async function createResignation(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = resignationInputSchema.parse(raw);
  const resignation = await prisma.$transaction(async (tx) => {
    const created = await tx.resignation.create({ data: input });
    await tx.exitChecklist.create({
      data: {
        employeeId: input.employeeId,
        resignationId: created.id,
        type: "RESIGNATION",
        targetExitDate: input.requestedLastDay,
        items: defaultExitItems(),
      },
    });
    await tx.employee.update({
      where: { id: input.employeeId },
      data: { employmentStatus: "NOTICE" },
    });
    return created;
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "Resignation",
    resourceId: resignation.id,
    changes: {
      employeeId: input.employeeId,
      requestedLastDay: input.requestedLastDay.toISOString(),
    },
  });
  return resignation;
}

export async function createTermination(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = terminationInputSchema.parse(raw);
  const termination = await prisma.$transaction(async (tx) => {
    const created = await tx.termination.create({
      data: { ...input, initiatedBy: actor.id },
    });
    await tx.exitChecklist.create({
      data: {
        employeeId: input.employeeId,
        terminationId: created.id,
        type: "TERMINATION",
        targetExitDate: input.effectiveDate,
        items: defaultExitItems(),
      },
    });
    return created;
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "Termination",
    resourceId: termination.id,
    changes: {
      employeeId: input.employeeId,
      type: input.type,
      effectiveDate: input.effectiveDate.toISOString(),
    },
  });
  return termination;
}

function defaultExitItems(): Prisma.InputJsonValue {
  return [
    {
      key: "handover",
      label: "Knowledge and responsibility handover",
      owner: "MANAGER",
      status: "OPEN",
    },
    {
      key: "assets",
      label: "Return assigned assets",
      owner: "IT",
      status: "OPEN",
    },
    {
      key: "access",
      label: "Disable system and building access",
      owner: "IT",
      status: "OPEN",
    },
    {
      key: "finance",
      label: "Clear advances and reimbursements",
      owner: "FINANCE",
      status: "OPEN",
    },
    {
      key: "documents",
      label: "Issue controlled exit documents",
      owner: "HR",
      status: "OPEN",
    },
  ];
}

export async function manageAsset(raw: unknown, actor: CollaborationActor) {
  const input = assetInputSchema.parse(raw);
  if (input.action === "create") {
    const asset = await prisma.asset.create({
      data: {
        assetTag: input.assetTag,
        name: input.name,
        category: input.category,
        serialNumber: input.serialNumber ?? null,
      },
    });
    await recordAudit({
      actor,
      action: "CREATE",
      resourceEntity: "Asset",
      resourceId: asset.id,
      changes: { assetTag: asset.assetTag, category: asset.category },
    });
    return asset;
  }
  if (input.action === "assign") {
    const result = await prisma.asset.updateMany({
      where: {
        id: input.id,
        status: { in: [AssetStatus.AVAILABLE, AssetStatus.RETURNED] },
      },
      data: {
        status: AssetStatus.ASSIGNED,
        assignedEmployeeId: input.employeeId,
        assignedAt: new Date(),
        expectedReturnAt: input.expectedReturnAt ?? null,
        returnedAt: null,
        conditionAtIssue: input.condition ?? null,
      },
    });
    if (result.count !== 1)
      throw new ApiError("Available asset not found", 404);
    await recordAudit({
      actor,
      action: "ASSIGN",
      resourceEntity: "Asset",
      resourceId: input.id,
      changes: { employeeId: input.employeeId },
    });
    return { id: input.id, status: AssetStatus.ASSIGNED };
  }
  const result = await prisma.asset.updateMany({
    where: {
      id: input.id,
      status: { in: [AssetStatus.ASSIGNED, AssetStatus.RETURN_DUE] },
    },
    data: {
      status: input.status,
      returnedAt: new Date(),
      conditionAtReturn: input.condition ?? null,
    },
  });
  if (result.count !== 1) throw new ApiError("Assigned asset not found", 404);
  await recordAudit({
    actor,
    action: "STATUS_CHANGE",
    resourceEntity: "Asset",
    resourceId: input.id,
    changes: { status: input.status },
  });
  return { id: input.id, status: input.status };
}

export async function issueGeneratedDocument(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = generatedDocumentInputSchema.parse(raw);
  const verificationCode = randomBytes(12).toString("hex").toUpperCase();
  const verificationUrl = `${process.env.APP_URL ?? "http://localhost:3001"}/verify/document/${verificationCode}`;
  const qrCode = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 320,
  });
  const snapshot = input.snapshot as Prisma.InputJsonValue;
  const data: Prisma.GeneratedDocumentUncheckedCreateInput = {
    templateId: input.templateId ?? null,
    employeeId: input.employeeId ?? null,
    applicationId: input.applicationId ?? null,
    type: input.type,
    title: input.title,
    expiresAt: input.expiresAt ?? null,
    snapshot,
    verificationCode,
    qrCode,
    fileHash: createHash("sha256")
      .update(JSON.stringify(snapshot))
      .digest("hex"),
    createdBy: actor.id,
  };
  const document = await prisma.generatedDocument.create({ data });
  await recordAudit({
    actor,
    action: "ISSUE",
    resourceEntity: "GeneratedDocument",
    resourceId: document.id,
    changes: { type: input.type, verificationCode },
  });
  return document;
}

export async function updateGeneratedDocumentStatus(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = documentStatusInputSchema.parse(raw);
  const document = await prisma.generatedDocument.update({
    where: { id: input.id },
    data: {
      status: input.status,
      ...(input.status === DocumentStatus.REVOKED
        ? { revokedAt: new Date(), revocationReason: input.reason ?? null }
        : {}),
    },
  });
  await recordAudit({
    actor,
    action: "STATUS_CHANGE",
    resourceEntity: "GeneratedDocument",
    resourceId: document.id,
    changes: {
      status: input.status,
      ...(input.reason ? { reason: input.reason } : {}),
    },
  });
  return document;
}

export async function createInterviewRound(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = interviewRoundInputSchema.parse(raw);
  if (input.scheduledEnd <= input.scheduledStart)
    throw new ApiError("Interview end must be after the start", 400);
  const [application, interviewers] = await Promise.all([
    prisma.application.findUnique({
      where: { id: input.applicationId },
      select: { jobId: true },
    }),
    prisma.interviewer.count({
      where: { id: { in: input.interviewerIds }, isActive: true },
    }),
  ]);
  if (!application || application.jobId !== input.jobId)
    throw new ApiError("Application and job do not match", 409);
  if (interviewers !== new Set(input.interviewerIds).size)
    throw new ApiError("One or more interviewers are unavailable", 409);
  const interview = await prisma.interviewRound.create({
    data: {
      applicationId: input.applicationId,
      jobId: input.jobId,
      sequence: input.sequence,
      name: input.name,
      type: input.type,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      timezone: input.timezone,
      location: input.location ?? null,
      meetingUrl: input.meetingUrl ?? null,
      interviewerIds: input.interviewerIds,
      scorecard: input.scorecard as Prisma.InputJsonValue,
      createdBy: actor.id,
    },
  });
  await prisma.applicationActivity.create({
    data: {
      applicationId: input.applicationId,
      actorId: actor.id,
      type: "INTERVIEW_SCHEDULED",
      summary: `${input.name} scheduled`,
      metadata: {
        interviewRoundId: interview.id,
        scheduledStart: input.scheduledStart.toISOString(),
      },
    },
  });
  await recordAudit({
    actor,
    action: "CREATE",
    resourceEntity: "InterviewRound",
    resourceId: interview.id,
    changes: { applicationId: input.applicationId, sequence: input.sequence },
  });
  return interview;
}

export async function submitInterviewFeedback(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = interviewFeedbackInputSchema.parse(raw);
  const interviewer = await prisma.interviewer.findUnique({
    where: { id: input.interviewerId },
    select: { userId: true },
  });
  if (
    !interviewer ||
    (interviewer.userId !== actor.id && !actor.isAdministrator)
  )
    throw new ApiError(
      "Feedback can only be submitted by the assigned interviewer",
      403,
    );
  const feedback = await prisma.interviewFeedback.upsert({
    where: {
      interviewRoundId_interviewerId: {
        interviewRoundId: input.interviewRoundId,
        interviewerId: input.interviewerId,
      },
    },
    create: {
      interviewRoundId: input.interviewRoundId,
      interviewerId: input.interviewerId,
      scores: input.scores as Prisma.InputJsonValue,
      strengths: input.strengths ?? null,
      concerns: input.concerns ?? null,
      recommendation: input.recommendation,
    },
    update: {
      scores: input.scores as Prisma.InputJsonValue,
      strengths: input.strengths ?? null,
      concerns: input.concerns ?? null,
      recommendation: input.recommendation,
    },
  });
  await recordAudit({
    actor,
    action: "UPDATE",
    resourceEntity: "InterviewFeedback",
    resourceId: feedback.id,
    changes: { recommendation: input.recommendation },
  });
  return feedback;
}

export async function updateInterviewStatus(
  raw: unknown,
  actor: CollaborationActor,
) {
  const input = interviewStatusInputSchema.parse(raw);
  const interview = await prisma.interviewRound.update({
    where: { id: input.id },
    data: { status: input.status },
  });
  await recordAudit({
    actor,
    action: "STATUS_CHANGE",
    resourceEntity: "InterviewRound",
    resourceId: interview.id,
    changes: { status: input.status },
  });
  return interview;
}
