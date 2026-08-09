import { RecommendationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authorizeCollaboration } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  listRecommendationsForModeration,
  recommendationStatistics,
} from "@/modules/collaboration/server/recommendations";

export async function GET(request: Request) {
  try {
    const actor = await authorizeCollaboration("canManageRecommendations");
    const status = z
      .enum(RecommendationStatus)
      .optional()
      .parse(new URL(request.url).searchParams.get("status") || undefined);
    const [recommendations, statistics] = await Promise.all([
      listRecommendationsForModeration(actor, status),
      recommendationStatistics(actor),
    ]);
    return NextResponse.json({ recommendations, statistics });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load recommendations");
  }
}
