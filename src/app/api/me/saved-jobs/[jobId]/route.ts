import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  removeSavedJob,
  saveJob,
} from "@/modules/engagement/server/engagement";

export async function PUT(
  _: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    return NextResponse.json({
      savedJob: await saveJob(session.user.id, (await params).jobId),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to save job");
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    await removeSavedJob(session.user.id, (await params).jobId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to remove saved job");
  }
}
