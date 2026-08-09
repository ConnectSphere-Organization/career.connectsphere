import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { privateDocumentDownloadUrl } from "@/lib/uploads/cloudinary";
import { getScopedApplication } from "@/modules/recruitment/server/applications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canViewApplicants");
    const { identifier } = await params;
    const application = await getScopedApplication(identifier, actor);
    if (!application.cloudinaryPublicId)
      throw new ApiError("Resume is not available", 404);
    return NextResponse.redirect(
      privateDocumentDownloadUrl(application.cloudinaryPublicId),
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to open resume");
  }
}
