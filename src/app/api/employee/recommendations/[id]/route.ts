import { NextResponse } from "next/server";

import { authorizeStaffReferrer } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { deleteOwnedRecommendation } from "@/modules/collaboration/server/recommendations";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeStaffReferrer();
    await deleteOwnedRecommendation((await params).id, actor);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to delete referral");
  }
}
