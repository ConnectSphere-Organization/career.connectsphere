import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { decideOwnedOffer } from "@/modules/documents/server/documents";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  try {
    const session = await getSession();
    if (!session)
      throw new ApiError("Authentication required", 401, "UNAUTHENTICATED");
    const { offerId } = await params;
    return NextResponse.json(
      {
        message: "Offer response recorded",
        ...(await decideOwnedOffer(
          offerId,
          session.user.id,
          await request.json(),
        )),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to record offer response");
  }
}
