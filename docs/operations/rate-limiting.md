# Rate limiting

The application includes a bounded process-local limiter for development and defense in depth on sensitive contact, application, resume parsing, and recruitment email actions. When `RATE_LIMIT_REST_URL` and `RATE_LIMIT_REST_TOKEN` are configured, the same checks use an Upstash-compatible Redis REST pipeline and coordinate counters across replicas.

Production must configure the shared Redis REST limiter and should retain WAF/bot controls at the edge. If the shared service is configured but unavailable, protected requests fail closed with `RATE_LIMIT_UNAVAILABLE`. Configure trusted proxy headers and monitor 429/503 rates.
