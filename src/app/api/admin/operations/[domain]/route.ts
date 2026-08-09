import { NextResponse } from "next/server";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import type { Capability } from "@/lib/auth/policy";
import { apiErrorResponse } from "@/lib/http/api-error";
import type { OperationsDomain } from "@/modules/operations/schema";
import {
  createBonus,
  createDeduction,
  createFinalSettlement,
  createInterviewRound,
  createLeaveRequest,
  createPayrollRun,
  createReimbursement,
  createResignation,
  createSalaryStructure,
  createTermination,
  issueGeneratedDocument,
  listOperationsDomain,
  manageAsset,
  recordAttendance,
  reviewLeaveRequest,
  reviewReimbursement,
  submitInterviewFeedback,
  updateGeneratedDocumentStatus,
  updateInterviewStatus,
} from "@/modules/operations/server/operations";

const permissions: Record<OperationsDomain, Capability> = {
  attendance: "canManageAttendance",
  leave: "canManageLeave",
  salary: "canManagePayroll",
  payroll: "canManagePayroll",
  deduction: "canManagePayroll",
  bonus: "canManagePayroll",
  reimbursement: "canManagePayroll",
  settlement: "canManagePayroll",
  resignation: "canManageExits",
  termination: "canManageExits",
  asset: "canManageExits",
  document: "canManageDocuments",
  interview: "canManageInterviews",
};

function domainFrom(value: string): OperationsDomain {
  if (!(value in permissions)) throw new Error("Unknown operations domain");
  return value as OperationsDomain;
}

export async function GET(
  _: Request,
  context: { params: Promise<{ domain: string }> },
) {
  try {
    const domain = domainFrom((await context.params).domain);
    await authorizeCollaboration(permissions[domain]);
    return NextResponse.json({ records: await listOperationsDomain(domain) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load operations records");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ domain: string }> },
) {
  try {
    const domain = domainFrom((await context.params).domain);
    const actor = await authorizeCollaboration(permissions[domain]);
    const body = await request.json();
    const action = new URL(request.url).searchParams.get("action");
    const record = await dispatch(domain, action, body, actor);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update operations record");
  }
}

async function dispatch(
  domain: OperationsDomain,
  action: string | null,
  body: unknown,
  actor: Awaited<ReturnType<typeof authorizeCollaboration>>,
) {
  switch (domain) {
    case "attendance":
      return recordAttendance(body, actor);
    case "leave":
      return action === "review"
        ? reviewLeaveRequest(body, actor)
        : createLeaveRequest(body, actor);
    case "salary":
      return createSalaryStructure(body, actor);
    case "payroll":
      return createPayrollRun(body, actor);
    case "deduction":
      return createDeduction(body, actor);
    case "bonus":
      return createBonus(body, actor);
    case "reimbursement":
      return action === "review"
        ? reviewReimbursement(body, actor)
        : createReimbursement(body, actor);
    case "settlement":
      return createFinalSettlement(body, actor);
    case "resignation":
      return createResignation(body, actor);
    case "termination":
      return createTermination(body, actor);
    case "asset":
      return manageAsset(body, actor);
    case "document":
      return action === "status"
        ? updateGeneratedDocumentStatus(body, actor)
        : issueGeneratedDocument(body, actor);
    case "interview": {
      if (action === "feedback") return submitInterviewFeedback(body, actor);
      if (action === "status") return updateInterviewStatus(body, actor);
      return createInterviewRound(body, actor);
    }
  }
}
