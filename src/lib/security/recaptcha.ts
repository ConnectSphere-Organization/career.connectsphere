import "server-only";

import { env } from "@/config/env";
import { ApiError } from "@/lib/http/api-error";

export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction: string,
  request?: Request,
): Promise<void> {
  if (!env.RECAPTCHA_SECRET_KEY) return;
  if (!token)
    throw new ApiError(
      "Bot verification is required",
      400,
      "RECAPTCHA_REQUIRED",
    );
  const body = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: token,
  });
  const remoteIp = request?.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new ApiError(
      "Bot verification provider is unavailable",
      503,
      "RECAPTCHA_UNAVAILABLE",
    );
  const result = (await response.json()) as {
    success?: boolean;
    score?: number;
    action?: string;
  };
  if (
    !result.success ||
    result.action !== expectedAction ||
    (result.score ?? 0) < 0.5
  )
    throw new ApiError("Bot verification failed", 400, "RECAPTCHA_FAILED");
}
