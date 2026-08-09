import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { recordAnalyticsEvent } from "@/modules/engagement/server/engagement";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    return NextResponse.json(
      await recordAnalyticsEvent(await request.json(), session?.user.id),
      { status: 202 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to record analytics event");
  }
}
