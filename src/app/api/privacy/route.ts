import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/authorization";
import { apiErrorResponse } from "@/lib/http/api-error";
import {
  createDeletionRequest,
  getPrivacyCenter,
} from "@/modules/privacy/server/privacy";

export async function GET() {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    return NextResponse.json(await getPrivacyCenter(session.user.id));
  } catch (error) {
    return apiErrorResponse(error, "Unable to load privacy center");
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    return NextResponse.json(
      {
        request: await createDeletionRequest(session.user.id),
        message: "Deletion request submitted",
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to submit deletion request");
  }
}
