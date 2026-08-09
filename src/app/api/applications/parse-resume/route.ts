import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { assertUploadIsClean } from "@/lib/security/upload-scanner";
import { parseResume } from "@/modules/applications/server/resume-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, {
      namespace: "resume-parse",
      limit: 10,
      windowMs: 15 * 60_000,
    });
    const session = await getSession();
    if (!session)
      throw new ApiError("Authentication required", 401, "UNAUTHENTICATED");
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
      throw new ApiError("Multipart form data is required", 415);
    const resume = (await request.formData()).get("resume");
    if (!(resume instanceof File))
      throw new ApiError("Resume is required", 400, "INVALID_RESUME");
    await assertUploadIsClean(resume);
    return NextResponse.json({ parsed: await parseResume(resume) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to parse resume");
  }
}
