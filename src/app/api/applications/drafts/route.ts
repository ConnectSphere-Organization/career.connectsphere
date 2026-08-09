import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import {
  deleteApplicationDraft,
  listApplicationDrafts,
  upsertApplicationDraft,
} from "@/modules/engagement/server/engagement";

function userIdFrom(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user.id ?? null;
}

export async function GET() {
  try {
    const userId = userIdFrom(await getSession());
    if (!userId) throw new ApiError("Authentication required", 401);
    return NextResponse.json({ drafts: await listApplicationDrafts(userId) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load application drafts");
  }
}

export async function PUT(request: Request) {
  try {
    const userId = userIdFrom(await getSession());
    if (!userId) throw new ApiError("Authentication required", 401);
    return NextResponse.json({
      draft: await upsertApplicationDraft(userId, await request.json()),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to save application draft");
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = userIdFrom(await getSession());
    if (!userId) throw new ApiError("Authentication required", 401);
    const jobId = new URL(request.url).searchParams.get("jobId");
    if (!jobId) throw new ApiError("jobId is required", 400);
    await deleteApplicationDraft(userId, jobId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to delete application draft");
  }
}
