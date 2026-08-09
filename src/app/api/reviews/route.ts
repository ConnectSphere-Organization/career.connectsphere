import { NextResponse } from "next/server";

import { authorizeEmployee } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  getOwnReview,
  submitReview,
} from "@/modules/collaboration/server/reviews";

export async function GET() {
  try {
    const actor = await authorizeEmployee({ allowFormer: true });
    return NextResponse.json({ review: await getOwnReview(actor) });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load review");
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorizeEmployee({ allowFormer: true });
    return NextResponse.json(
      { review: await submitReview(await request.json(), actor) },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to submit review");
  }
}
