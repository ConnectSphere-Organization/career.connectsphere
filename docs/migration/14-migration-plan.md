# 14 — Migration Plan

## Objective

Migrate the legacy React/Vite + Express/Mongoose career platform to a Next.js application while preserving observable behavior, data integrity, authorization, document workflows, and operational safety. The legacy `mern/` application remains read-only during this documentation task and remains the production reference until later implementation and verification gates pass.

## Non-goals for this documentation phase

- No Next.js scaffold or application code.
- No legacy source edits.
- No dependency installation.
- No database, secret, provider, or deployment changes.
- No feature status advancement in `09-feature-parity-matrix.md`.
- No claim that a feature is implemented or verified.

## Guardrails

1. Keep one authoritative writer per domain during migration; avoid unmanaged dual-write.
2. Preserve legacy IDs and public URLs until redirect/token compatibility is proven.
3. Deny by default on server authorization; UI hiding is not authorization.
4. Never copy secrets from source environment files.
5. Use production-like sanitized data only through approved snapshots/fixtures.
6. Each vertical slice must include data, API, UI, authorization, observability, tests, rollback, and documentation.
7. Separate parity changes from intentional product/security changes and obtain explicit approval for each divergence.

## Blockers to resolve before implementation

These blockers are independent work items and correspond to the blocker register in `09-feature-parity-matrix.md`:

- **Architecture:** deployment topology and API compatibility boundary (`B-01`).
- **Data:** target data layer, ObjectId/index/reference compatibility, migration mechanics (`B-02`).
- **Experience:** route map, visual tolerance, SEO/redirect behavior, browser/accessibility support (`B-03`, `B-14`).
- **Identity:** session design and coexistence/rotation strategy (`B-04`).
- **Authorization:** canonical role/department/status/permission/assigned-job policy (`B-05`).
- **Providers:** email, storage, reCAPTCHA, PDFs/QR/CSV assets and contracts (`B-06`–`B-08`).
- **Domain:** slugs/publication and all state-transition invariants (`B-09`, `B-10`).
- **Runtime/operations:** resume parsing, privacy/security, background work, retries, observability (`B-11`–`B-13`).

No blocker should be treated as resolved by default framework behavior.

## Phase 0 — Documentation and decision baseline (current phase)

### Deliverables

- Feature ledger: `09-feature-parity-matrix.md`.
- Environment inventory: `11-environment-variable-map.md`.
- Risk register: `13-migration-risks.md`.
- Phased plan: this document.
- Test and verification contract: `15-test-parity-plan.md`.
- Later decision records for architecture, data, auth, authorization, storage, email, and background work.

### Exit criteria

- Every discovered public, identity, jobs/application, document, people/HR, review/recommendation, notification/audit, and operational flow has a matrix row.
- Environment names are classified without values.
- Blockers, risks, owners-to-be-assigned, verification criteria, and rollback principles are explicit.
- Stakeholders approve moving from documentation into characterization.

### Mandatory stop

**This requested work ends at the completion of Phase 0. Do not scaffold, edit, install, migrate, deploy, or implement anything as part of this documentation task. All phases below are future implementation phases requiring separate approval and execution.**

---

## Phase 1 — Legacy characterization (later phase; not executed)

### Work

- Instrument or observe representative legacy network traffic without altering behavior.
- Build black-box Playwright characterization around all active routes and role flows.
- Capture API contracts: methods, paths, status codes, payload shapes, headers, files, error envelopes, and side effects.
- Establish sanitized deterministic fixtures for users, jobs, applications, offers, contracts, reviews, recommendations, notifications, and audit events.
- Resolve apparent client/server path mismatches by runtime evidence.
- Baseline screenshots at 375, 768, 1024, and 1440 pixels; baseline accessibility and performance.

### Exit gate

A reviewed “observed legacy behavior” corpus exists and can run against an isolated legacy environment without real email/storage side effects.

## Phase 2 — Architecture and target foundation (later phase; not executed)

### Work

- Approve ADRs for topology, data access, auth/session, authorization, storage, email/outbox, background jobs, and observability.
- Scaffold Next.js App Router with strict TypeScript, linting, formatting, Vitest, Playwright, accessibility checks, environment validation, structured logging, and CI.
- Define route groups/layouts, typed domain boundaries, error contracts, server-only modules, and adapters.
- Add `/api/health`, security headers/CSP report-only mode, correlation IDs, secret scanning, and dependency scanning.
- Create isolated test infrastructure and deterministic seed/reset commands.

### Exit gate

A deployed non-production shell passes build, unit smoke tests, security configuration checks, and rollback/deployment smoke tests; no business route is cut over.

## Phase 3 — Read-only public tracer slice (later phase; not executed)

### Scope

Home, published job list/search/filter/sort, job detail, approved reviews, sitemap, metadata, responsive shared layout.

### Work

- Connect target read model to sanitized/approved data source.
- Preserve publication visibility and slug/ID compatibility.
- Implement metadata, canonical URLs, sitemap, images, loading/error/not-found states.
- Run dual-app functional, visual, accessibility, SEO, and performance comparisons.

### Rollout

Shadow requests or route a small preview-only cohort; no target writes.

### Exit gate

Applicable public matrix rows reach `IMPLEMENTED`, then `VERIFIED` only under `15-test-parity-plan.md`.

## Phase 4 — Identity and authorization foundation (later phase; not executed)

### Scope

Register, email verification/resend, login, current-user, logout, forgot/reset password, session expiry, route/API authorization.

### Work

- Implement approved session transition with rotation/revocation and secure cookie/CSRF controls if selected.
- Encode canonical role/permission/status/department/assigned-job policy in one server module.
- Build fixtures for anonymous, user, employee, HR variants, admin, super-admin, suspended/former/inactive users, and assigned/unassigned jobs.
- Add exhaustive negative authorization tests before exposing protected UI.

### Exit gate

No privilege escalation or cross-user access in automated/manual review; coexistence and rollback tested.

## Phase 5 — Candidate application vertical slice (later phase; not executed)

### Scope

Apply, custom questions, resume upload/parsing, question files, My Applications, status checks, application detail ownership.

### Work

- Implement storage scanning/private access and parser fallback.
- Enforce one application/idempotency rules defined by product.
- Preserve all question types and answer serialization.
- Add application confirmation through outbox/fake mail in tests.
- Compare database effects and user-visible outcomes between apps.

### Exit gate

Candidate and authorized HR flows pass contracts, privacy/security checks, responsive parity, and failure recovery.

## Phase 6 — HR jobs, applications, and dashboard (later phase; not executed)

### Scope

Job CRUD/questions/reordering, assigned-job scoping, application lists/detail/resume access, dashboard stats, status transitions, rejection/welcome actions.

### Work

- Implement explicit application transition service with audit/notification/email events.
- Validate Cloudinary/provider cleanup behavior and query/index performance.
- Test concurrent edits, duplicate requests, stale updates, and permission changes mid-session.

### Exit gate

All HR/admin role permutations and assignment boundaries pass; operational budgets meet baseline.

## Phase 7 — Offers, acceptance, contracts, and certificates (later phase; not executed)

### Scope

Offer generation/manual/bulk issue, PDF/QR/email/download/verification/extension/token actions, public acceptance/rejection, contract submission/upload/review/PDF, certificate issue/verify/download/email.

### Work

- Freeze transition and output contracts first.
- Implement one-time token and expiry semantics; protect replay and enumeration.
- Use deterministic document renderers and golden fixtures.
- Protect bank/identity documents and redact logs/audits.
- Make mail and document-generation retries idempotent.

### Exit gate

Golden PDF/QR/CSV comparisons, token abuse tests, PII access tests, and recovery drills pass.

## Phase 8 — People, HR administration, recommendations, reviews, notifications, audit (later phase; not executed)

### Scope

User/employee lifecycle, CSV import, role/delete, HR permissions/assignments, employee profile, recommendations, review submission/moderation, notifications, audit logs.

### Work

- Add safe onboarding links rather than reusable plaintext temporary credentials.
- Enforce super-admin constraints and self-lockout protections.
- Implement domain-event/outbox notification behavior and unread-state consistency.
- Ensure all privileged changes create redacted immutable audit events.

### Exit gate

Bulk operation rollback/replay, moderation workflows, notification consistency, and privileged security tests pass.

## Phase 9 — Data rehearsal and production readiness (later phase; not executed)

### Work

- Inventory actual counts, nulls, enums, duplicate slugs, orphan references, and index health.
- Rehearse snapshot → migration/backfill → validation → rollback at production scale.
- Load-test API, uploads, parsing, PDF, mail queue, and database queries.
- Enforce CSP after report-only cleanup; complete threat model, accessibility audit, dependency/SBOM/secret scan, backup restore, and incident runbooks.
- Freeze schema/contract changes before cutover rehearsal.

### Exit gate

Signed migration report, rollback timing within objective, no unresolved critical/high security issues, and all candidate features `VERIFIED`.

## Phase 10 — Progressive cutover (later phase; not executed)

### Sequence

1. Deploy target dark with no public routing.
2. Shadow read requests and compare normalized responses.
3. Canary read-only public routes.
4. Increase read traffic while monitoring error rate, latency, DB load, and visual/user reports.
5. Cut authenticated reads only after session coexistence is proven.
6. Schedule a controlled write cutover with one authoritative writer and a rollback window.
7. Validate smoke suite, counts/checksums, queues, email/storage, audit, and critical user journeys.

### Automatic rollback triggers

- Authentication or authorization anomaly.
- Data divergence or failed invariant/checksum.
- Elevated 5xx/timeout/error budget breach.
- Missing/duplicate document or email side effects.
- PII exposure, upload security failure, or secret leak.
- Broken critical flow at any required viewport/role.

### Rollback

Route traffic to legacy, disable target writes, drain/retain target outbox safely, reconcile writes by request/import IDs, restore snapshot only when required, invalidate risky sessions/tokens, and record incident evidence.

## Phase 11 — Stabilization and legacy retirement (later phase; not executed)

### Work

- Run both observability views through an agreed stabilization window.
- Resolve discrepancies and close matrix rows with linked evidence.
- Remove compatibility aliases/proxies only after traffic and logs prove no usage.
- Archive sanitized migration artifacts and retention-controlled audit evidence.
- Revoke old credentials, remove legacy deployment access, and retain rollback backup for approved duration.

### Exit gate

Stakeholder sign-off, zero legacy traffic for the agreed window, restore drill completed, and decommission checklist approved.

## Status governance

- Start implementation: `NOT_STARTED` → `IN_PROGRESS`.
- Code exists and local/CI implementation tests pass: `IN_PROGRESS` → `IMPLEMENTED`.
- Work cannot proceed due to a documented external decision/dependency: `IN_PROGRESS` → `BLOCKED`.
- Full evidence in `15-test-parity-plan.md` passes: `IMPLEMENTED` → `VERIFIED`.
- Documentation, code review, or a single happy-path test never justifies `VERIFIED`.

## Implementation log

### 2026-07-12 — Public homepage slice

- Implemented the App Router homepage with all active legacy content sections, responsive imagery, metadata, motion reveals, and approved-review carousel.
- Added public-route loading and error states plus shared reveal behavior.
- Preserved the source emerald/slate visual language, DM Sans/Outfit typography, mobile bottom navigation, and copied public assets in the separate target project.
- Validation passed: Prisma schema validation, strict TypeScript, zero-warning ESLint, and Next.js Turbopack production build.
- Browser smoke checks passed at 1280px and 375px with eight homepage sections and no horizontal overflow.
- `PUB-01` remains only `IMPLEMENTED`, not `VERIFIED`: the legacy application was not simultaneously running, deterministic database review fixtures were unavailable, and screenshot parity at all four required widths has not yet passed.

### 2026-07-12 — Environment and authentication foundation

- Added a repeatable `env:from-mern` mapper that reads required values from the read-only MERN environment and writes an ignored, mode-0600 `.env.local` without displaying secrets.
- Migrated MongoDB, SMTP, Cloudinary, reCAPTCHA and local parity URL configuration names; generated a distinct Better Auth secret rather than reusing the legacy JWT secret.
- Implemented Better Auth registration, login, verification-email delivery, reset-link request, and token-based password reset with TanStack Form and Zod validation.
- Preserved existing bcrypt compatibility while moving new sessions to secure Better Auth cookies and keeping role/status fields server-controlled.
- Added one centralized Nodemailer adapter using the migrated SMTP configuration.
- Validation passed: Prisma schema, strict TypeScript, zero-warning ESLint, and the production Turbopack build.
- Authentication rows remain `IMPLEMENTED`, not `VERIFIED`, until SMTP sandbox delivery, existing-user credential-account migration, live Mongo compatibility, and dual-app flow tests pass.
