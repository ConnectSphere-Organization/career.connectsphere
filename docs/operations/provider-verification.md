# Provider verification runbook

Use provider sandbox accounts and non-production data. Required checks before release:

- SMTP: verification, reset, application confirmation, interview reminder, offer and document emails; validate idempotency and bounced-address handling.
- Cloudinary/private storage: upload, signed read, expiration, deletion, oversized/type rejection and scanner quarantine.
- reCAPTCHA: valid, invalid, expired and provider-unavailable responses; production must fail closed on protected public mutations.
- PDF/font: deterministic offline build, Unicode names, long content, page breaks, QR readability and golden-file hashes.
- Token links: valid, expired, reused, rotated and revoked links; ensure public projections never expose salary, bank data or tokens.
- Calendar/webhooks: create/reschedule/cancel, signature verification, replay protection, retry and dead-letter recovery.

Record provider request IDs and sanitized screenshots/logs as release evidence. Secrets and candidate data must never be attached to tickets.
