import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { listSavedJobs } from "@/modules/engagement/server/engagement";

export async function GET() {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    return NextResponse.json({
      savedJobs: await listSavedJobs(session.user.id),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load saved jobs");
  }
}
