import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

import { AuthorizationError } from "@/lib/auth/authorization";
import { captureException, log, metric } from "@/lib/observability/logger";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "REQUEST_FAILED",
  ) {
    super(message);
  }
}

export function apiErrorResponse(
  error: unknown,
  fallback: string,
  requestId = randomUUID(),
): NextResponse {
  if (error instanceof AuthorizationError || error instanceof ApiError) {
    const code =
      error instanceof ApiError
        ? error.code
        : error.status === 401
          ? "UNAUTHENTICATED"
          : "FORBIDDEN";
    log("warn", "api.request.rejected", {
      requestId,
      status: error.status,
      code,
    });
    metric("api_request_rejected_total", 1, { status: error.status, code });
    return NextResponse.json(
      {
        error: { code, message: error.message, requestId },
        message: error.message,
      },
      { status: error.status, headers: { "x-request-id": requestId } },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message ?? "Invalid request",
          requestId,
          details: error.flatten(),
        },
        message: error.issues[0]?.message ?? "Invalid request",
      },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }
  log("error", "api.request.failed", {
    requestId,
    message: error instanceof Error ? error.message : "Unknown error",
  });
  metric("api_request_failed_total", 1, { status: 500 });
  captureException(error, { requestId });
  return NextResponse.json(
    {
      error: { code: "INTERNAL_ERROR", message: fallback, requestId },
      message: fallback,
    },
    { status: 500, headers: { "x-request-id": requestId } },
  );
}
