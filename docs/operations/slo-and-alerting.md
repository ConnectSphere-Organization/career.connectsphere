# SLO and alerting

## Service objectives

- Public job discovery availability: 99.9% monthly.
- Authenticated recruitment/HR operations availability: 99.5% monthly.
- p95 server response: under 750 ms for reads and 1.5 s for ordinary mutations, excluding file/PDF work.
- Application submission success: 99.5% excluding validation failures.
- Email/webhook delivery: 99% within 15 minutes; no event remains pending over 30 minutes.
- Privacy deletion/export response: completed before the recorded due date.

## Signals

Scrape `/api/metrics` with `Authorization: Bearer $METRICS_TOKEN`. Structured logs, exceptions and metric events can be sent to `OBSERVABILITY_HTTP_ENDPOINT`. Correlate incidents with `x-request-id`.

Alert when outbox failures or webhook dead letters are non-zero for 10 minutes, email failures exceed 5 in 15 minutes, readiness fails twice, p95 latency breaches its objective for 15 minutes, or error-budget burn exceeds 2% in one hour.

## Response

1. Confirm health/readiness and dependency status.
2. Inspect request IDs and external collector traces/errors.
3. Pause the outbox worker if deliveries are causing downstream harm.
4. Replay only idempotent events after correcting the cause.
5. Communicate impact, preserve audit evidence, and create a post-incident review.
