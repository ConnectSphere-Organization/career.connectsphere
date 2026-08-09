import { NextResponse } from "next/server";

import { isEnabledAccountStatus } from "@/lib/auth/account-status";
import { getSession } from "@/lib/auth/authorization";
import {
  ApplicationError,
  getOwnedApplicationStatus,
} from "@/modules/applications/server/applications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> },
) {
  const session = await getSession();
  if (!session || !isEnabledAccountStatus(session.user.status)) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }
  try {
    const { identifier } = await params;
    return NextResponse.json(
      await getOwnedApplicationStatus(identifier, session.user.id),
    );
  } catch (error) {
    if (error instanceof ApplicationError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      { message: "Unable to check application status" },
      { status: 500 },
    );
  }
}
