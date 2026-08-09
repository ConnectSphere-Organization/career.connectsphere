import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  createScopedJob,
  listScopedJobs,
} from "@/modules/jobs/server/recruitment-jobs";

export async function GET() {
  try {
    const actor = await authorizeRecruitment("canManageJobs");
    return NextResponse.json({ jobs: await listScopedJobs(actor) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load jobs");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeRecruitment("canCreateJob");
    if (!actor.isAdministrator && !actor.permissions.canManageJobs) {
      return NextResponse.json(
        { message: "Permission required: canManageJobs" },
        { status: 403 },
      );
    }
    const job = await createScopedJob(await request.json(), actor);
    return NextResponse.json({ message: "Job created", job }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create job");
  }
}
