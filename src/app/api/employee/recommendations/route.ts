import { NextResponse } from "next/server";

import { authorizeStaffReferrer } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  createRecommendation,
  listOwnedRecommendations,
  listRecommendableApplications,
  listReferralJobs,
} from "@/modules/collaboration/server/recommendations";

export async function GET() {
  try {
    const actor = await authorizeStaffReferrer();
    const [recommendations, candidates, jobs] = await Promise.all([
      listOwnedRecommendations(actor),
      listRecommendableApplications(actor),
      listReferralJobs(),
    ]);
    return NextResponse.json({ recommendations, candidates, jobs });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load referrals");
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorizeStaffReferrer();
    return NextResponse.json(
      {
        recommendation: await createRecommendation(await request.json(), actor),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to create recommendation");
  }
}
