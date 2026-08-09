import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { regenerateOfferToken } from "@/modules/documents/server/documents";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canGenerateOfferLetter");
    const token = await regenerateOfferToken((await params).id, actor);
    return NextResponse.json(
      {
        message: "Response link regenerated",
        responseUrl: `${env.APP_URL}/offer/respond/${token}`,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to regenerate response link");
  }
}
