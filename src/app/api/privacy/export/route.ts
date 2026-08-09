import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { exportCandidateData } from "@/modules/privacy/server/privacy";

export async function GET() {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    return NextResponse.json(await exportCandidateData(session.user.id), {
      headers: {
        "content-disposition": `attachment; filename="connectsphere-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to export candidate data");
  }
}
