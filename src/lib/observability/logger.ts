import "server-only";

type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, boolean | number | string | null | undefined>;

const sensitiveKey =
  /authorization|cookie|password|secret|token|email|phone|resume|address|bank|account|document/i;

function sanitize(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKey.test(key) ? "[REDACTED]" : value,
    ]),
  );
}

function exportEvent(payload: Record<string, unknown>): void {
  const endpoint = process.env.OBSERVABILITY_HTTP_ENDPOINT;
  if (!endpoint) return;
  void fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.OBSERVABILITY_HTTP_TOKEN
        ? { authorization: `Bearer ${process.env.OBSERVABILITY_HTTP_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(2_000),
  }).catch(() => undefined);
}

export function log(
  level: LogLevel,
  event: string,
  context: LogContext = {},
): void {
  const record = {
    timestamp: new Date().toISOString(),
    kind: "log",
    level,
    service: "connectsphere-career-portal",
    environment: process.env.NODE_ENV ?? "development",
    event,
    ...sanitize(context),
  };
  const payload = JSON.stringify(record);
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
  exportEvent(record);
}

export function metric(
  name: string,
  value: number,
  context: LogContext = {},
): void {
  exportEvent({
    timestamp: new Date().toISOString(),
    kind: "metric",
    service: "connectsphere-career-portal",
    environment: process.env.NODE_ENV ?? "development",
    name,
    value,
    ...sanitize(context),
  });
}

export function captureException(
  error: unknown,
  context: LogContext = {},
): void {
  const exception =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack?.slice(0, 4_000),
        }
      : { name: "UnknownError", message: String(error) };
  exportEvent({
    timestamp: new Date().toISOString(),
    kind: "exception",
    service: "connectsphere-career-portal",
    environment: process.env.NODE_ENV ?? "development",
    exception,
    ...sanitize(context),
  });
}
