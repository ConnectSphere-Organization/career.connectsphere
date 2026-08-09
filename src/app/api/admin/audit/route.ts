import { AuditAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeSuperAdmin } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { listAuditLogs } from "@/modules/collaboration/server/audit";

export async function GET(request: Request) {
  try {
    await authorizeSuperAdmin();
    const action = z
      .enum(AuditAction)
      .optional()
      .parse(new URL(request.url).searchParams.get("action") || undefined);
    return NextResponse.json({ logs: await listAuditLogs(action) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load audit records");
  }
}
