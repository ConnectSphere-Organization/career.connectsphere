import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { issueOffer, listOffers } from "@/modules/documents/server/documents";

export async function GET() {
  try {
    const actor = await authorizeRecruitment("canGenerateOfferLetter");
    return NextResponse.json({ offers: await listOffers(actor) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load offers");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeRecruitment("canGenerateOfferLetter");
    const result = await issueOffer(await request.json(), actor);
    return NextResponse.json(
      { message: "Offer issued", ...result },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to issue offer");
  }
}
