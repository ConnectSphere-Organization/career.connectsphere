import { ReviewStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { listReviewsForModeration } from "@/modules/collaboration/server/reviews";

export async function GET(request: Request) {
  try {
    await authorizeCollaboration("canManageReviews");
    const status = z
      .enum(ReviewStatus)
      .optional()
      .parse(new URL(request.url).searchParams.get("status") || undefined);
    return NextResponse.json({
      reviews: await listReviewsForModeration(status),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load reviews");
  }
}
