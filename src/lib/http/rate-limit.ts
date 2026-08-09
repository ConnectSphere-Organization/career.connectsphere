import "server-only";

import { createHash } from "node:crypto";

import { ApiError } from "@/lib/http/api-error";

type Bucket = { count: number; resetAt: number };
type RateLimitOptions = { namespace: string; limit: number; windowMs: number };

const buckets = new Map<string, Bucket>();
const maximumBuckets = 5_000;

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  );
}

/**
 * Bounded, process-local protection for development and single-instance deployments.
 * Production must additionally use a trusted distributed limiter at the platform/WAF
 * or a shared store; this map cannot coordinate across replicas or serverless isolates.
 */
async function enforceDistributedRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<boolean> {
  const url = process.env.RATE_LIMIT_REST_URL;
  const token = process.env.RATE_LIMIT_REST_TOKEN;
  if (!url || !token) return false;
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, options.windowMs, "NX"],
      ["PTTL", key],
    ]),
    signal: AbortSignal.timeout(2_000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new ApiError(
      "Rate-limit service is unavailable",
      503,
      "RATE_LIMIT_UNAVAILABLE",
    );
  const result = (await response.json()) as Array<{ result?: number }>;
  const count = Number(result[0]?.result ?? 0);
  if (count > options.limit)
    throw new ApiError(
      "Too many requests; try again later",
      429,
      "RATE_LIMITED",
    );
  return true;
}

export async function enforceRateLimit(
  request: Request,
  options: RateLimitOptions,
): Promise<void> {
  const identity = createHash("sha256")
    .update(clientKey(request))
    .digest("hex")
    .slice(0, 32);
  if (
    await enforceDistributedRateLimit(
      `connectsphere:rate:${options.namespace}:${identity}`,
      options,
    )
  )
    return;
  const now = Date.now();
  if (buckets.size >= maximumBuckets) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
    if (buckets.size >= maximumBuckets)
      buckets.delete(buckets.keys().next().value as string);
  }

  const key = `${options.namespace}:${identity}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }
  if (current.count >= options.limit) {
    throw new ApiError(
      "Too many requests; try again later",
      429,
      "RATE_LIMITED",
    );
  }
  current.count += 1;
}
