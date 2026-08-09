# ConnectSphere Careers + HRMS Expansion Roadmap

## Architecture decision

Keep one Next.js modular monolith and MongoDB/Prisma data store. Add domain modules and a separate worker process for asynchronous delivery, PDF generation, retention jobs, integrations, and analytics export. Do not split business domains into microservices until scale or ownership requires it.

## Delivery principles

- Every phase ships complete vertical slices: model, policy, API, UI, audit, migration, tests, and operations.
- Existing `User.department`, `User.position`, and offer/contract fields remain compatibility projections until backfills are verified.
- Sensitive actions are deny-by-default, assigned-job scoped where applicable, and audited.
- Financial, bank, identity, and candidate data require encryption, field allowlists, retention rules, and negative authorization tests.
- Mongo migrations use dry-run reports, targeted indexes, reversible backfills, and production-like rehearsal.

## Phase 1 — identity, organization, and privacy foundation

### Employee and organization master

- `Employee`: canonical employment identity linked one-to-one with `User`.
- `Department` and `Designation`: managed organization records.
- Manager hierarchy and employment lifecycle timestamps.
- Backfill hired/staff users from current user, offer, application, and contract data.
- Keep legacy user fields synchronized during transition.

### Candidate privacy lifecycle

- Versioned `ConsentRecord` for application processing, referrals, talent community, and marketing.
- `CandidateProfile` for canonical candidate identity and retention state.
- `DataSubjectRequest` for access/export/correction/deletion.
- Candidate privacy center, machine-readable export, deletion-request workflow, and admin review.
- Retention policy configuration and worker-ready purge state.

**Exit gate:** every employee has a canonical Employee record; every new application records consent; candidates can request/export data; deletion requests are auditable.

## Phase 2 — recruiting operations

- `InterviewRound`, `InterviewParticipant`, `InterviewFeedback`, `ScorecardTemplate`.
- Calendar-safe scheduling, reminders, time zones, reschedule/cancel lifecycle.
- Recruiter notes, tags, ownership, mentions, tasks, and immutable application activity timeline.
- Configurable communication templates and message history.
- Application drafts with autosave, upload recovery, expiry, and final consent.
- Job requisition/headcount/deadline/publish/archive workflow.

**Exit gate:** an application can move through configurable interviews and scorecards with complete activity history and authenticated E2E coverage.

## Phase 3 — HRMS core

- Attendance and shift policies.
- Leave types, balances, requests, approvals, and calendars.
- Employee document vault and verification workflow.
- Assets, allocations, returns, and inventory history.
- Promotion, transfer, department, designation, manager, and compensation history.
- Performance cycles, goals, feedback, and appraisals.
- Onboarding templates, task assignments, owners, due dates, and completion evidence.

**Exit gate:** employee lifecycle from accepted offer through active employment is represented outside `User` and contract snapshots.

## Phase 4 — payroll and finance

- `SalaryStructure`, components, effective dating, CTC breakup, deductions, bonus, reimbursement, and tax records.
- `PayrollRun`, payroll items, approvals, locking, reruns, and reconciliation.
- Encrypted bank/payment data and separation-of-duties policy.
- Payslip PDF generation, employee delivery, and finance reports.
- Finance/payroll dashboard and exports.

**Exit gate:** deterministic payroll calculation with approval, audit, encrypted data, reconciliation, and golden-file tests.

## Phase 5 — exits and controlled documents

- Resignation, termination, notice period, handover, no-dues checklist, assets, and final settlement.
- Relieving, experience, termination, and appointment letters.
- `DocumentTemplate` and `GeneratedDocument` with verification code, QR payload, validity, expiry, revocation, signatures, and immutable snapshots.

**Exit gate:** complete voluntary/involuntary exit workflow and independently verifiable controlled documents.

## Phase 6 — careers growth and search

- Server-side cursor pagination, full-text search, facets, counts, saved views, and search index adapter.
- Saved jobs, alerts, unsubscribe/preferences, talent community, and source/UTM attribution.
- Teams, locations, culture, values, benefits, stories, hiring process, accommodations, FAQ, and CMS publishing.
- JobPosting JSON-LD, localization, region-aware validation, and guest-apply product decision.
- Funnel analytics: view → apply start → abandonment → submit → interview → offer → hire.

## Phase 7 — integrations and production operations

- `IntegrationConnection`, `WebhookEndpoint`, `WebhookDelivery`, signing secrets, replay, retries, and DLQ.
- HRIS, calendar, background-check, assessment, Slack/Teams, and ATS export adapters.
- Durable worker for email, PDF, parsing, retention, webhooks, and analytics.
- OpenTelemetry traces/metrics, error tracking, SLOs, alerts, dashboards, and runbooks.
- Admin MFA/SSO, secret rotation, malware scanning, hardened CSP, and threat model.

## Quality program (runs across every phase)

- WCAG 2.2 AA target; axe, keyboard, focus, contrast, and screen-reader tests.
- Authenticated Playwright journeys for candidate, employee, recruiter, payroll, privacy, and admin roles.
- Real Mongo replica-set API tests, provider sandbox tests, visual regression, load tests, and browser policy.
- Route-level loading/error/recovery states and mobile management layouts.
- CI gates: format, lint, typecheck, unit, integration, build, E2E, accessibility, dependency/secret scans.

## RBAC evolution

Keep stored legacy roles during migration. Introduce capabilities and scoped assignments for `RECRUITER`, `HIRING_MANAGER`, `HR`, `FINANCE`, `PAYROLL_ADMIN`, and `VERIFIER`, then migrate to role assignments only after policy parity tests pass. Never use role labels alone for data access.
