# 11 — Environment Variable Map

## Safety rule

This inventory contains **names and semantics only**. It intentionally contains no secret values, connection strings, account identifiers, or copied `.env` content. Real secrets must be stored in the deployment platform's secret manager; local development uses ignored files derived from a committed placeholder-only example.

The names below were discovered from first-party references in `mern/backend` and `mern/frontend/src`. Dependency-internal variables were excluded.

## Classification

- **Secret**: server-only credential; never expose through `NEXT_PUBLIC_*`, logs, browser bundles, snapshots, or test artifacts.
- **Sensitive config**: server-only operational endpoint/configuration that may reveal infrastructure.
- **Public config**: safe for browser exposure after review.
- **Runtime**: platform-supplied or non-secret process behavior.

## Server and shared runtime variables

| Legacy variable         | Classification   | Legacy purpose                                    | Planned target variable / disposition                                   | Required?    | Validation / migration note                                                                 |
| ----------------------- | ---------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `NODE_ENV`              | Runtime          | Development/production behavior and error details | `NODE_ENV` (platform managed)                                           | Yes          | Accept only expected runtime values; never use as the sole security control.                |
| `PORT`                  | Runtime          | Express listener port                             | Usually platform managed; retain only for custom server deployment      | Conditional  | App Router deployment may not consume this directly.                                        |
| `VERCEL`                | Runtime          | Detect legacy serverless execution                | Remove application dependency; use target runtime/deployment primitives | No           | Do not use it to bypass origin checks.                                                      |
| `MONGO_URI`             | Secret           | Primary MongoDB connection URI                    | `MONGODB_URI` as canonical server-only name                             | Yes          | Required in runtime validation; redact host/user details from logs.                         |
| `MONGODB_URI`           | Secret           | Alternate URI used by some scripts                | Consolidate into canonical `MONGODB_URI`                                | Transitional | Remove fallback ambiguity after scripts migrate.                                            |
| `JWT_SECRET`            | Secret           | Signs/verifies bearer JWTs                        | `AUTH_SECRET` or approved auth-library secret                           | Yes          | Generate high-entropy value; rotation and dual-key transition required if sessions coexist. |
| `JWT_EXPIRES_IN`        | Sensitive config | JWT lifetime                                      | `AUTH_SESSION_TTL` or retain during compatibility phase                 | Yes          | Parse with a strict duration schema and enforce bounds.                                     |
| `JWT_COOKIE_EXPIRES_IN` | Sensitive config | Cookie lifetime helper                            | `AUTH_COOKIE_MAX_AGE_DAYS` if cookie sessions selected                  | Conditional  | Must not exceed server/session expiry.                                                      |
| `VERBOSE_AUTH_LOGS`     | Runtime          | Enables verbose authentication logging            | `AUTH_LOG_LEVEL` or remove                                              | No           | Production must never log tokens, OTPs, or sensitive user payloads.                         |
| `FRONTEND_URL`          | Sensitive config | Builds links and cross-service frontend origin    | `APP_URL`                                                               | Yes          | Absolute HTTPS URL in production; validate origin and trailing slash.                       |

## Email variables

The source currently supports overlapping aliases. The target should expose one canonical SMTP contract and translate legacy aliases only during a short compatibility phase.

| Legacy variable  | Classification   | Legacy purpose                | Planned target variable / disposition                         | Required?              | Validation / migration note                                 |
| ---------------- | ---------------- | ----------------------------- | ------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| `EMAIL_USER`     | Sensitive config | Sender/login username         | `SMTP_USER`                                                   | Yes when email enabled | Treat as server-only even when it resembles an address.     |
| `MAIL_USER`      | Sensitive config | Alias for email username      | Consolidate to `SMTP_USER`                                    | Transitional           | Warn on legacy alias; do not support indefinitely.          |
| `SMTP_USER`      | Sensitive config | Alias/canonical SMTP username | `SMTP_USER`                                                   | Yes when email enabled | Trim; never log with credential diagnostics.                |
| `EMAIL_PASS`     | Secret           | Sender password/app password  | `SMTP_PASSWORD`                                               | Yes when email enabled | Secret manager only; never normalize or expose client-side. |
| `MAIL_PASS`      | Secret           | Alias for sender password     | Consolidate to `SMTP_PASSWORD`                                | Transitional           | Reject conflicting aliases.                                 |
| `SMTP_PASS`      | Secret           | Alias for sender password     | Consolidate to `SMTP_PASSWORD`                                | Transitional           | Prefer the explicit canonical name.                         |
| `MAIL_HOST`      | Sensitive config | SMTP host                     | `SMTP_HOST`                                                   | Conditional            | Required for host-based transport.                          |
| `SMTP_HOST`      | Sensitive config | SMTP host alias               | `SMTP_HOST`                                                   | Conditional            | Validate hostname; disallow unexpected protocols.           |
| `MAIL_PORT`      | Sensitive config | SMTP port                     | `SMTP_PORT`                                                   | Conditional            | Integer in valid range; typically 465 or 587 by policy.     |
| `SMTP_PORT`      | Sensitive config | SMTP port alias               | `SMTP_PORT`                                                   | Conditional            | Parse strictly; no silent `NaN` fallback.                   |
| `MAIL_SECURE`    | Sensitive config | TLS mode                      | `SMTP_SECURE`                                                 | Conditional            | Strict boolean; ensure consistency with port and provider.  |
| `SMTP_SECURE`    | Sensitive config | TLS mode alias                | `SMTP_SECURE`                                                 | Conditional            | Fail closed on invalid values.                              |
| `MAIL_SERVICE`   | Sensitive config | Nodemailer service preset     | Remove if explicit SMTP is selected; otherwise `SMTP_SERVICE` | Conditional            | Avoid mixed service/host configuration.                     |
| `REPLY_TO_EMAIL` | Sensitive config | Reply-to address              | `EMAIL_REPLY_TO`                                              | No                     | Validate mailbox syntax.                                    |

## Storage and anti-abuse variables

| Legacy variable           | Classification   | Legacy purpose                      | Planned target variable / disposition                                    | Required?   | Validation / migration note                                                         |
| ------------------------- | ---------------- | ----------------------------------- | ------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------- |
| `CLOUDINARY_CLOUD_NAME`   | Sensitive config | Cloudinary account/cloud identifier | Retain if Cloudinary selected, otherwise provider-neutral storage config | Conditional | Server-only by default; public delivery config may be separately exposed if needed. |
| `CLOUDINARY_API_KEY`      | Secret           | Cloudinary API credential           | Retain server-only if selected                                           | Conditional | Never use a `NEXT_PUBLIC_*` name.                                                   |
| `CLOUDINARY_API_SECRET`   | Secret           | Cloudinary API secret               | Retain server-only if selected                                           | Conditional | Rotate if exposure is suspected; redact all errors.                                 |
| `RECAPTCHA_SECRET_KEY`    | Secret           | Server-side reCAPTCHA verification  | `RECAPTCHA_SECRET_KEY`                                                   | Conditional | Required whenever public protected forms enable reCAPTCHA.                          |
| `VITE_RECAPTCHA_SITE_KEY` | Public config    | Browser reCAPTCHA site key          | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`                                         | Conditional | Public by design, but restrict allowed domains at provider.                         |

## Browser/runtime configuration

| Legacy variable                | Classification | Legacy purpose                 | Planned target variable / disposition                                   | Required?   | Validation / migration note                                       |
| ------------------------------ | -------------- | ------------------------------ | ----------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `VITE_API_URL`                 | Public config  | Axios API origin/base URL      | Prefer same-origin relative `/api`; otherwise `NEXT_PUBLIC_API_URL`     | Conditional | If external, validate HTTPS origin and CORS policy.               |
| `VITE_API_BASE_URL`            | Public config  | Alternate API base reference   | Consolidate with `NEXT_PUBLIC_API_URL` or remove                        | No          | One source of truth only.                                         |
| `VITE_BASE_URL`                | Public config  | Frontend/base URL reference    | Prefer server-only `APP_URL`; expose only if browser needs it           | Conditional | Avoid using untrusted values to construct redirects.              |
| `VITE_NODE_ENV`                | Public config  | Client environment label       | Remove; use build/runtime primitives                                    | No          | Security must not depend on browser environment labels.           |
| `DEV`                          | Build runtime  | Vite development boolean       | Remove; replace with framework runtime behavior                         | No          | This is not a deploy-time env contract.                           |
| `VITE_AUTO_REFRESH_TOKEN`      | Public config  | Token/session UI behavior      | Remove or `NEXT_PUBLIC_AUTO_REFRESH_SESSION` after auth ADR             | Conditional | Strict boolean; do not let browser settings weaken server expiry. |
| `VITE_SESSION_TIMEOUT`         | Public config  | Session timeout UI             | `NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MS` only if needed                    | Conditional | Server remains authoritative; validate bounded integer.           |
| `VITE_SHOW_SESSION_STATUS`     | Public config  | Session-status UI visibility   | `NEXT_PUBLIC_SHOW_SESSION_STATUS`                                       | No          | Strict boolean.                                                   |
| `VITE_TOKEN_CHECK_INTERVAL`    | Public config  | Browser token polling interval | Remove if server session strategy eliminates polling; otherwise renamed | Conditional | Bound minimum to avoid request/event churn.                       |
| `VITE_TOKEN_WARNING_THRESHOLD` | Public config  | Expiry warning threshold       | `NEXT_PUBLIC_SESSION_WARNING_THRESHOLD_MS`                              | Conditional | Must be less than authoritative session lifetime.                 |

## Source references not backed by discovered variables

The backend dependencies include AI SDK packages, but first-party source inspection did not discover corresponding API-key environment references. Do not invent or provision AI credentials until an implemented flow and provider decision require them.

## Proposed target schema groups

The exact names remain subject to architecture decisions, but target validation should separate:

1. **Server secrets**: database, auth signing/encryption, SMTP password, storage secret, reCAPTCHA secret.
2. **Server configuration**: app URL, SMTP host/port/TLS/user/reply-to, session lifetimes, log level.
3. **Public configuration**: only site key and truly browser-required behavior, each explicitly prefixed `NEXT_PUBLIC_`.
4. **Test-only configuration**: legacy base URL, target base URL, test database, fake mail service, storage emulator, and seeded actor credentials supplied by CI secret storage—not committed.

## Validation and lifecycle requirements

- Parse all variables once in a server-only module using a schema validator; fail startup/build for missing or malformed required values.
- Maintain separate server and client schemas so accidental secret imports into client components fail review/build checks.
- Reject conflicting legacy aliases rather than silently selecting one.
- Commit only a placeholder-only `.env.example`; ignore `.env`, `.env.local`, test result files, and storage-state files.
- Never print raw environment variables. Error messages may name a missing variable but must not include its value.
- Use isolated development, test, preview, and production credentials with least privilege.
- Rotate credentials before production cutover if they have ever appeared in tracked files, logs, chat, screenshots, or artifacts.
- Add secret scanning to pre-commit/CI and scan repository history before migration deployment.
