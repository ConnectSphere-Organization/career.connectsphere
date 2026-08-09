import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import {
  removeScopedJobImage,
  replaceScopedJobImage,
} from "@/modules/jobs/server/recruitment-jobs";

type Context = { params: Promise<{ identifier: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const actor = await authorizeRecruitment("canManageJobs");
    const value = (await request.formData()).get("image");
    if (!(value instanceof File))
      throw new ApiError("Job image is required", 400);
    return NextResponse.json({
      job: await replaceScopedJobImage((await params).identifier, value, actor),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to upload job image");
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const actor = await authorizeRecruitment("canManageJobs");
    await removeScopedJobImage((await params).identifier, actor);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to remove job image");
  }
}
