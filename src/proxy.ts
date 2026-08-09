import { NextResponse, type NextRequest } from "next/server";

import { isAllowedRequestOrigin } from "@/lib/http/origin-policy";

function allowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return isAllowedRequestOrigin({
    origin,
    requestOrigin: request.nextUrl.origin,
    ...(process.env.APP_URL ? { configuredOrigin: process.env.APP_URL } : {}),
    development: process.env.NODE_ENV !== "production",
  })
    ? origin
    : null;
}

export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    request.headers.has("origin") &&
    !allowedOrigin(request)
  ) {
    return NextResponse.json(
      {
        error: {
          code: "CORS_REJECTED",
          message: "Origin is not allowed",
          requestId,
        },
        message: "Origin is not allowed",
      },
      { status: 403, headers: { "x-request-id": requestId } },
    );
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  const origin = allowedOrigin(request);
  if (origin && request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("access-control-allow-origin", origin);
    response.headers.set("access-control-allow-credentials", "true");
    response.headers.set("vary", "Origin");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
