import { NextResponse } from "next/server";

import { authorizeRecruitment } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import { updateOfferStatus } from "@/modules/documents/server/documents";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizeRecruitment("canGenerateOfferLetter");
    return NextResponse.json({
      message: "Offer status updated",
      ...(await updateOfferStatus(
        (await params).id,
        await request.json(),
        actor,
      )),
    });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update offer status");
  }
}
