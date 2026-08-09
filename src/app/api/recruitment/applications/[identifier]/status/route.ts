import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { transitionApplicationStatus } from "@/modules/recruitment/server/applications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const { identifier } = await params;
    const application = await transitionApplicationStatus(
      identifier,
      await request.json(),
      actor,
    );
    return NextResponse.json({
      message: "Application status updated",
      application,
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update application status");
  }
}
