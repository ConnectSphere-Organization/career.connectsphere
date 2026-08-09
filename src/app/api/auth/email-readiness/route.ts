import { NextResponse } from "next/server";

import {
  isDevelopmentMailboxEnabled,
  verifyEmailTransport,
} from "@/lib/email/mailer";

export async function GET() {
  try {
    await verifyEmailTransport();
    return NextResponse.json({
      ready: true,
      mode: isDevelopmentMailboxEnabled() ? "development" : "smtp",
    });
  } catch {
    return NextResponse.json({
      ready: false,
      message:
        "Email delivery is temporarily unavailable. Please contact support.",
    });
  }
}
