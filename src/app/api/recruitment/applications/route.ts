import { ApplicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { listScopedApplications } from "@/modules/recruitment/server/applications";

const querySchema = z.object({ status: z.enum(ApplicationStatus).optional() });

export async function GET(request: Request) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const url = new URL(request.url);
    const { status } = querySchema.parse({
      status: url.searchParams.get("status") || undefined,
    });
    return NextResponse.json({
      applications: await listScopedApplications(actor, status),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load applications");
  }
}
