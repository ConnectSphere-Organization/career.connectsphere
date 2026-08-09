import { NextResponse } from "next/server";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { moderateRecommendation } from "@/modules/collaboration/server/recommendations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeCollaboration("canManageRecommendations");
    await moderateRecommendation(
      (await params).id,
      await request.json(),
      actor,
    );
    return NextResponse.json({ message: "Recommendation updated" });
  } catch (error) {
    return apiErrorResponse(error, "Unable to moderate recommendation");
  }
}
