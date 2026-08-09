import { NextResponse } from "next/server";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { moderateReview } from "@/modules/collaboration/server/reviews";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeCollaboration("canManageReviews");
    await moderateReview((await params).id, await request.json(), actor);
    return NextResponse.json({ message: "Review moderated" });
  } catch (error) {
    return apiErrorResponse(error, "Unable to moderate review");
  }
}
