import { NextResponse } from "next/server";

import { isEnabledAccountStatus } from "@/lib/auth/account-status";
import { getSession } from "@/lib/auth/authorization";
import { enforceRateLimit } from "@/lib/http/rate-limit";
import { verifyRecaptcha } from "@/lib/security/recaptcha";
import {
  ApplicationError,
  listOwnedApplications,
  submitOwnedApplication,
} from "@/modules/applications/server/applications";

function authorizedUserId(
  session: Awaited<ReturnType<typeof getSession>>,
): string | null {
  if (!session || !isEnabledAccountStatus(session.user.status)) return null;
  return session.user.id;
}

export async function GET() {
  const userId = authorizedUserId(await getSession());
  if (!userId)
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  return NextResponse.json({
    applications: await listOwnedApplications(userId),
  });
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, {
      namespace: "application-submit",
      limit: 10,
      windowMs: 15 * 60_000,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Too many requests" },
      { status: 429 },
    );
  }
  const userId = authorizedUserId(await getSession());
  if (!userId)
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("multipart/form-data")
  ) {
    return NextResponse.json(
      { message: "Multipart form data is required" },
      { status: 415 },
    );
  }
  try {
    const formData = await request.formData();
    await verifyRecaptcha(
      typeof formData.get("recaptchaToken") === "string"
        ? String(formData.get("recaptchaToken"))
        : null,
      "application_submit",
      request,
    );
    const application = await submitOwnedApplication(formData, userId, request);
    return NextResponse.json(
      { message: "Application submitted successfully", application },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ApplicationError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    console.error("Application submission failed", error);
    return NextResponse.json(
      { message: "Unable to submit application" },
      { status: 500 },
    );
  }
}
