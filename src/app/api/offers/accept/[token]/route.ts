import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/http/api-error";
import {
  decideOffer,
  getPublicOfferByToken,
} from "@/modules/documents/server/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    return NextResponse.json(
      { offer: await getPublicOfferByToken(token) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to load offer");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    return NextResponse.json(
      {
        message: "Offer response recorded",
        ...(await decideOffer(token, await request.json())),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to record offer response");
  }
}
