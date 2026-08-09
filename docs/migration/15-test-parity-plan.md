# 15 — Test Parity Plan

## Goal

Prove that the target Next.js application preserves approved legacy behavior while meeting stronger security, accessibility, reliability, and maintainability requirements. The strategy uses **Vitest** for fast deterministic code/contract tests and **Playwright** for browser-level **dual-app parity** against isolated legacy and target deployments.

No migration feature may be marked `VERIFIED` merely because it was implemented or documented.

## Current automation status (2026-07-12)

| Area                    | Automated evidence now present                                                                                                                                                | Current result / limitation                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest schemas          | Authentication normalization, registration password matching, application fields/answers, contact normalization, certificate date ordering, and job input/default validation. | Implemented in `tests/unit/schemas.test.ts`; local deterministic coverage only.                                                                                  |
| Vitest authorization    | HR identity, administrator/permission decisions, and assigned-job access policy.                                                                                              | Implemented against extracted pure policy functions in `tests/unit/authorization-policy.test.ts`; server/session/database integration is not covered.            |
| Vitest workflow         | Complete application status transition table plus illegal skip/reverse/repeat/terminal cases.                                                                                 | Implemented in `tests/unit/application-status-transitions.test.ts`; persistence concurrency remains an integration concern.                                      |
| Vitest transforms       | Salary parsing/formatting and seven-day new-job classification boundary.                                                                                                      | Implemented in `tests/unit/job-utils.test.ts`.                                                                                                                   |
| Target Playwright smoke | `/`, `/jobs`, `/contact`, `/login`, and `/register`; semantic page landmarks, navigation, and horizontal overflow.                                                            | Configured for Chromium at exact widths 375, 768, 1024, and 1440. Public data-dependent pages degrade to empty states when the database is unavailable.          |
| Target auth validation  | Invalid login email and mismatched registration passwords, including proof that validation prevents auth requests.                                                            | Configured at all four required widths; no database fixture is required.                                                                                         |
| Dual-app parity         | Shared route availability/content-type checks for `/`, `/jobs`, `/login`, and `/register`.                                                                                    | Environment-aware skip unless both `PLAYWRIGHT_TARGET_URL` and `PLAYWRIGHT_LEGACY_URL` are supplied. This is smoke evidence only, not semantic or visual parity. |

**Parity status:** no feature is promoted to `VERIFIED` by this test addition. A successful target-only run is not dual-app evidence. Until the isolated MERN URL and equivalent fixtures are available and the parity suite passes both applications, affected rows remain at their existing status.

### Commands

- `pnpm test` runs deterministic Vitest suites.
- `pnpm test:e2e:smoke` runs target public/auth smoke tests and starts the local Next development server when `PLAYWRIGHT_TARGET_URL` is absent.
- `PLAYWRIGHT_TARGET_URL=<target> PLAYWRIGHT_LEGACY_URL=<legacy> pnpm test:e2e:parity` runs the currently available dual-app smoke contract. Missing URLs produce explicit skips, not passes.

## Test systems

| System                  | Purpose                                                 | Rules                                                                                             |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Legacy reference        | Characterize observed source behavior                   | Isolated test deployment/database; no production email/storage; stable legacy build SHA recorded. |
| Target candidate        | Validate migrated behavior                              | Same logical fixtures and time controls; target build SHA recorded.                               |
| Fake/external providers | Mail, storage, reCAPTCHA, parsing/document dependencies | Sandbox/emulator/fake adapters; deterministic responses; failure modes injectable.                |
| Evidence store          | Reports, screenshots, traces, normalized API results    | Access controlled, retention limited, scrubbed of secrets/PII.                                    |

Both applications must start from equivalent seeded logical records, not a shared mutable database during parallel tests. Each test run receives a unique namespace/run ID and performs cleanup.

## Tool responsibilities

### Vitest

Vitest will cover:

- Pure domain rules and state-transition tables.
- Zod/environment/input schemas and normalization.
- Slug generation and collision behavior.
- Authorization policy decisions for every actor/resource/action tuple.
- API handler/service contracts with repositories/providers mocked at boundaries.
- Data mapping between legacy document shapes and target models.
- Email template models and outbox/idempotency behavior.
- Notification/audit event creation and redaction.
- PDF/CSV input models; PDF metadata/text normalization helpers; QR payload generation.
- Session expiry, token rotation/replay policy, cache invalidation, and error mapping.
- Upload allowlist, filename, size, content-signature, and access-policy functions.

Vitest tests must avoid real network calls, real clocks, random IDs, and provider credentials. Inject clock, ID generator, repository, mail, storage, and queue interfaces.

### Playwright

Playwright projects will target two base URLs:

- `legacy`: the isolated Vite/Express reference.
- `target`: the isolated Next.js candidate.

A shared scenario contract runs against both through small app-specific adapters only where selectors/bootstrapping differ. Assertions compare normalized business outcomes; screenshots compare approved visual states. Tests must use semantic roles/labels/test IDs, not fragile CSS structure.

## Required viewport matrix

Every critical route and flow must run at these exact viewport widths:

|    Width | Representative class           | Default height | Required checks                                                                                                      |
| -------: | ------------------------------ | -------------: | -------------------------------------------------------------------------------------------------------------------- |
|  **375** | Mobile                         |            812 | No horizontal overflow; navigation/forms/modals usable; tap targets; sticky/fixed content does not obscure controls. |
|  **768** | Tablet                         |           1024 | Responsive navigation and grids; portrait forms/tables; no clipped actions.                                          |
| **1024** | Small desktop/tablet landscape |            768 | Dashboard/table density; sidebars and dialogs; keyboard operation.                                                   |
| **1440** | Desktop                        |            900 | Intended max-width, whitespace, full data tables, dialogs, and document previews.                                    |

Critical write flows run functionally at all four widths. Lower-risk admin permutations may use pairwise optimization only after at least one full run per route at all four widths and written approval; visual baselines remain required at all four.

## Actor and role matrix

Seed distinct actors with no shared browser storage:

| Actor                   | Key attributes                                               | Expected scope                                                                       |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Anonymous               | No session                                                   | Public jobs/reviews, verification, offer-token flow only.                            |
| Candidate user          | `role=user`, active, verified/unverified variants            | Own applications, notifications, application submission.                             |
| Employee                | `role=employee`, active                                      | Employee profile, eligible review/recommendations, own data.                         |
| Former employee         | `role=employee`, former                                      | Only explicitly approved former-employee review behavior; no active-only privileges. |
| Inactive/suspended user | Relevant role plus status                                    | Authentication/session behavior per policy; protected mutations denied.              |
| HR limited              | HR department, selected permissions, assigned subset of jobs | Only granted operations and assigned-job resources.                                  |
| HR unassigned           | HR department/permission but not assigned to resource        | Assigned-job operations denied.                                                      |
| Admin                   | `role=admin`                                                 | Approved admin capabilities, not super-admin-only operations.                        |
| Super-admin             | `role=super-admin`                                           | Role deletion/HR/audit critical administration.                                      |
| Permission variants     | One `can*` flag changed at a time                            | Exact capability enabled/disabled independent of hidden UI.                          |

For every protected endpoint, test anonymous (401), authenticated-but-unauthorized (403), wrong owner/assignment (404 or 403 per approved contract), and authorized success.

## Domain scenario suites

### Public and SEO

- Home sections, featured jobs, approved reviews, navigation/footer conditions.
- Job publication visibility, list/search/filter/sort, detail by canonical slug/ID.
- Empty, loading, API failure, malformed parameter, and not-found states.
- Contact submission success/validation/provider failure once endpoint ownership is decided.
- Certificate and offer verification: valid, unknown, malformed, expired/revoked where applicable.
- Metadata, canonical URL, robots, sitemap content/type, redirects, and unknown-route behavior.

### Identity/session

- Register validation, duplicate email, verification-required response.
- OTP valid/invalid/expired/reused, resend throttling, user-enumeration resistance.
- Login valid/invalid/unverified/inactive/suspended; generic errors.
- Session restoration, expiry warning, expiry, logout, cross-tab logout, revoked/rotated token.
- Forgot/reset password valid/invalid/expired/reused and existing/non-existing email parity without enumeration.
- Cookie attributes/CSRF if cookie sessions are selected; localStorage secret absence in target.

### Jobs and applications

- Job CRUD, image replacement/deletion, publish/active visibility, slug collision.
- Question CRUD/reorder and all types: text, multiple choice, checkbox, file, rating.
- Application with/without optional fields, resume, referral, and custom answers.
- Duplicate/replayed submission and concurrent submission behavior.
- Resume PDF/DOC/DOCX parse success, unsupported/corrupt/password-protected/oversized files, parser timeout, manual fallback.
- Candidate ownership for My Applications, detail, offer letter, status checks.
- HR assigned/unassigned application list/detail/resume access.
- Every approved application transition plus every illegal transition.
- Rejection/welcome email idempotency and failure behavior.

### Offers, contracts, and certificates

- Offer from application, manual issue, bulk CSV valid/partial/invalid/duplicate rows.
- Offer list/detail/status, extension history, token regeneration, email/download.
- Public token valid, malformed, expired, replayed, already accepted/rejected, token for another offer.
- Contract personal/address/emergency/identity/bank/employment/legal validation.
- Contract document valid/invalid type/oversize/content mismatch and unauthorized access.
- Contract list/detail/status legal and illegal transitions; PDF access.
- Certificate issue/list/verify/download/email and unknown ID.
- PDFs: content type/disposition, page count, extracted key text, deterministic normalized hash where feasible.
- QR codes: decode generated image and assert exact canonical verification URL.

### People, HR, recommendations, reviews

- User list/detail; status/account status/termination and audit/email side effects.
- Bulk employee CSV dry-run/import/retry/partial failures; onboarding-token safety.
- Role change/delete: non-super-admin denial, self-demotion/deletion policy, last-super-admin safeguard.
- HR create/list/revoke, permission changes, assigned-job changes, mid-session permission revocation.
- Employee recommendation ownership, count/limits if defined, delete, admin status/stats/linking.
- Review eligibility by role/status, one-review rule if defined, anonymous display, moderation transitions and notes.

### Notifications, audit, and operations

- Notification creation after job/application events, unread count, read/all-read/delete, cache invalidation.
- No duplicate notification on retried domain command.
- Audit actor/action/resource/change redaction and super-admin-only access.
- Health liveness/readiness and dependency failure.
- Rate-limit threshold/reset/key isolation and multi-instance/shared-store behavior.
- Security headers, CSP, CORS/preflight/origin policy, compression where applicable.
- Structured errors contain request ID and no stack/secret/PII in production mode.

## Security negative suite

The target cannot be `VERIFIED` without applicable negative cases:

1. Missing, malformed, expired, revoked, wrong-signature, and replayed auth/token credentials.
2. Horizontal access: another user's application, resume, notification, offer, contract, profile, or upload.
3. Vertical escalation: user/employee/HR/admin attempts super-admin or missing-permission actions.
4. Assigned-job bypass via direct API request, altered IDs, query filters, or stale session.
5. Mass assignment of `role`, `permissions`, `status`, `userId`, `issuedBy`, `reviewedBy`, and workflow fields.
6. ID/slug/token enumeration and response/timing leakage.
7. CSRF on state-changing routes if cookies are used; hostile `Origin` and preflight cases.
8. XSS payloads in names, rich descriptions, reviews, filenames, metadata, and query strings; verify rendering and CSP.
9. Injection payloads in Mongo filters/sort/search, CSV formula cells, email headers, and PDF fields.
10. Upload attacks: double extension, mismatched MIME/magic bytes, SVG/script, polyglot, path traversal, decompression/resource bomb, oversize, malware-test fixture.
11. Open redirect and link-generation poisoning through host/proxy headers or return URLs.
12. Rate-limit bypass using spoofed forwarding headers and distributed instances.
13. Sensitive-data leakage in client bundles, localStorage, URLs, logs, errors, traces, screenshots, PDFs, CSV reports, and caches.
14. OTP/reset/verification brute force, reuse, expiry, resend abuse, and account enumeration.
15. Offer acceptance token expiry/reuse/concurrency and state-changing GET prohibition.
16. Provider failure/timeout/retry without duplicate emails, documents, applications, offers, contracts, or audit events.

Use safe non-destructive payloads in isolated environments. Never run attack tests against production.

## Dual-app functional comparison

For each parity scenario:

1. Reset legacy and target to equivalent fixture snapshots.
2. Freeze clock and deterministic IDs where the apps permit; otherwise normalize volatile values.
3. Run the same user intent through the shared scenario contract.
4. Capture UI result, network contract, database projection, provider side effects, notification, and audit effect.
5. Normalize expected differences: generated IDs, timestamps, signed URL query strings, request IDs, and explicitly approved security changes.
6. Compare semantic results. Any unapproved difference fails parity.

Do not normalize status codes, authorization outcomes, missing fields, state transitions, money/date semantics, ownership, side-effect counts, or user-visible errors unless an approved divergence record exists.

## Visual comparison protocol

- Capture stable full-page and component/state screenshots for both apps at **375/768/1024/1440**.
- Disable animations/transitions, freeze time, use identical fonts/data/locale/timezone, and wait for network/fonts/images.
- Compare key states: default, empty, loading/skeleton where capturable, validation error, API error, populated, modal/menu open, success, and permission-denied/not-found.
- Dynamic regions may be masked only with a documented reason; never mask the principal feature, error, or authorization result.
- Start with a strict pixel-diff threshold appropriate to anti-aliasing (proposed maximum `0.2%` changed pixels), plus mandatory human review for approved baselines.
- Visual equivalence means same content hierarchy, controls, states, and responsive usability; intentional redesign requires product/design approval and a target baseline rather than forced pixel identity.
- Check horizontal overflow programmatically at every width.

## Accessibility checks

- Automated axe scan on every principal route/state with zero critical or serious violations.
- Keyboard-only traversal, visible focus, skip/navigation behavior, modal focus trap/return, menus, drag/reorder keyboard alternative.
- Labels, descriptions, errors, required state, live regions/toasts, tables, headings, landmarks, contrast, zoom/reflow, and reduced motion.
- Manual screen-reader smoke tests for login, application, offer acceptance/contract, and one admin workflow.

## Non-functional gates

- API error-rate, p50/p95 latency, upload/parser/PDF duration, DB query count, and concurrency compared to established legacy baseline and approved budgets.
- Core Web Vitals and bundle budgets for public and authenticated route groups.
- Load tests for search/list, application submission, PDF, parser queue, and notification count.
- Recovery tests for database/provider/queue outage, retry, dead-letter/reconciliation, and deploy rollback.
- Cross-browser latest stable Chromium, Firefox, and WebKit for critical journeys; mobile emulation is not a substitute for required widths.

## CI lanes

1. **Pull request fast lane:** type/lint, Vitest unit/contract, selected target Playwright smoke, secret/dependency scan.
2. **Parity lane:** legacy and target deployments, full shared Playwright functional suite across roles and viewports, normalized API/data comparison.
3. **Visual lane:** four-width screenshots and approved baseline diff.
4. **Security lane:** negative authorization/session/upload/origin/header suite.
5. **Nightly/release lane:** full browsers, accessibility, PDFs/QR/CSV, load/recovery, migration rehearsal, and rollback smoke.

Flaky tests are failures: quarantine requires an owner, issue, expiry date, and cannot cover a release-critical or security assertion.

## Evidence package

Each feature row must link to:

- Source and target build SHAs.
- Relevant Vitest report and coverage for changed domain logic.
- Legacy and target Playwright scenario result.
- Required viewport screenshots/diffs.
- Role/permission matrix result.
- Applicable security-negative result.
- API/data/side-effect comparison.
- Accessibility result.
- Product/security approval for intentional differences.
- Rollback or recovery evidence for write/side-effect features.

Artifacts must be redacted and access controlled.

## `VERIFIED` criteria

A feature may move from `IMPLEMENTED` to `VERIFIED` only when **all applicable** conditions are true:

1. Acceptance criteria and legacy observed behavior are documented; intentional differences are approved.
2. Relevant Vitest unit/domain/contract tests pass with meaningful branch coverage on authorization, transitions, validation, and errors—not a coverage number alone.
3. The same Playwright scenario passes against both legacy and target, or an approved divergence test proves the new behavior.
4. Functional behavior passes at **375, 768, 1024, and 1440**.
5. Every applicable actor/role/permission/status/ownership/assignment case passes, including denial paths.
6. Applicable security negative cases pass with no critical/high unresolved finding.
7. Visual comparisons pass or have explicit design approval at all four widths.
8. Accessibility has zero critical/serious automated findings and required manual checks pass.
9. API status/payload semantics, persisted data, emails/storage/documents, notifications, and audit side effects match approved contracts and are idempotent where required.
10. Performance/reliability budgets pass in the intended deployment runtime.
11. Migration/data reconciliation and rollback/recovery are demonstrated for stateful features.
12. Evidence is linked from the parity matrix and independently reviewed.

If any condition is unknown, failing, flaky, waived without approval, or untested, the feature remains `IMPLEMENTED`, `IN_PROGRESS`, or `BLOCKED`—never `VERIFIED`.
