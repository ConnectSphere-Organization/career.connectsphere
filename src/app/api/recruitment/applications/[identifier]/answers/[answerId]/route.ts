import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { applicationAnswerFileUrl } from "@/modules/recruitment/server/applications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string; answerId: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const { identifier, answerId } = await params;
    return NextResponse.redirect(
      await applicationAnswerFileUrl(identifier, answerId, actor),
      {
        headers: { "cache-control": "private, no-store" },
      },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to open answer file");
  }
}
