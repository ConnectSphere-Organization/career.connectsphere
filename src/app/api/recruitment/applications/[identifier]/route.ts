import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { getScopedApplication } from "@/modules/recruitment/server/applications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const { identifier } = await params;
    return NextResponse.json({
      application: await getScopedApplication(identifier, actor),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load application");
  }
}
