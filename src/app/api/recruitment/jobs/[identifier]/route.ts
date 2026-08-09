import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  getScopedJob,
  updateScopedJob,
} from "@/modules/jobs/server/recruitment-jobs";

type Context = { params: Promise<{ identifier: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const actor = await authorizeRecruitment("canManageJobs");
    const { identifier } = await params;
    return NextResponse.json({ job: await getScopedJob(identifier, actor) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load job");
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const actor = await authorizeRecruitment("canManageJobs");
    const { identifier } = await params;
    const job = await updateScopedJob(identifier, await request.json(), actor);
    return NextResponse.json({ message: "Job updated", job });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update job");
  }
}
