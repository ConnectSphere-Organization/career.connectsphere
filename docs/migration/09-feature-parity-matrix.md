# 09 — Feature Parity Matrix

## Purpose and scope

This is the migration control ledger for the legacy application under `mern/`. The planned target is the currently empty `career-portal/` implementation area. This document records source behavior, planned target ownership, and blockers; it does **not** claim that any feature has been migrated.

## Status vocabulary

Only these values may be used in the **Status** column:

- `NOT_STARTED`
- `IN_PROGRESS`
- `IMPLEMENTED`
- `VERIFIED`
- `BLOCKED`

Every migration feature is initially `NOT_STARTED`. A feature may become `VERIFIED` only after satisfying the criteria in `15-test-parity-plan.md`; documentation completion alone cannot advance feature status.

## Public experience

| ID     | Domain / flow                                            | Legacy source                                                                        | Planned target                                                                                | Status      | Blocker IDs      |
| ------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------- | ---------------- |
| PUB-01 | Home page, hero, approved reviews                        | `frontend/src/pages/Home.jsx`; hero and review components; public reviews API        | App Router `/`; server-rendered sections and reviews with interactive review carousel         | IMPLEMENTED | B-03             |
| PUB-02 | Job list, search, filter, sort, publication visibility   | `pages/JobsList.jsx`; `GET /api/jobs`, `/featured`, `/search`, `/filter`, `/sort`    | `/jobs`; typed jobs query service and interactive filtering                                   | IMPLEMENTED | B-02, B-03, B-09 |
| PUB-03 | Job detail by ID/slug and optional-auth visibility       | `GET /api/jobs/:id`; job `slug`, `isActive`, `isPublished`; frontend list navigation | `/jobs/[identifier]`; ID/slug compatibility resolver                                          | IMPLEMENTED | B-02, B-09       |
| PUB-04 | Contact page and form                                    | `pages/Contact.jsx`; frontend calls missing `POST /api/contact`                      | `/contact`; Zod/TanStack Form and SMTP-backed Route Handler                                   | IMPLEMENTED | B-06             |
| PUB-05 | Public certificate verification and download             | `/verify`, `/verify/:id`; certification verify/download endpoints                    | `/verify/[[...id]]`; redacted certificate verification API and public safe-field PDF download | IMPLEMENTED | B-07, B-08       |
| PUB-06 | Public offer-letter verification                         | `/verify-offer`, `/verify-offer/:id`; certification verify endpoint                  | `/verify-offer/[[...id]]`; redacted offer verification API                                    | IMPLEMENTED | B-07, B-08       |
| PUB-07 | Dynamic XML sitemap                                      | `Routes/sitemapRoutes.js`; `/api/sitemap.xml`                                        | App Router `sitemap.ts` or `/sitemap.xml` route                                               | IMPLEMENTED | B-09             |
| PUB-08 | Unknown-route fallback and shared navbar/footer behavior | `App.jsx`; wildcard renders Home; footer hidden on login/register/apply              | Next `not-found`, root layout, route-group layouts                                            | IMPLEMENTED | B-03             |
| PUB-09 | Responsive/loading/error/toast experience                | lazy routes, `Suspense`, Loader, skeletons, error boundaries, ToastContainer         | route `loading.tsx`, `error.tsx`, accessible notification system                              | IN_PROGRESS | B-03, B-14       |

## Identity, session, and authorization

| ID     | Domain / flow                             | Legacy source                                                   | Planned target                                                                            | Status      | Blocker IDs |
| ------ | ----------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- | ----------- |
| IAM-01 | Registration                              | `/register`; `POST /api/auth/register`                          | `/register`; TanStack Form, Zod validation, Better Auth sign-up, server-controlled role   | IMPLEMENTED | B-04, B-06  |
| IAM-02 | Email verification and resend             | `/verify-email`; verify/resend endpoints                        | Better Auth token verification with SMTP delivery and automatic post-verification sign-in | IMPLEMENTED | B-04, B-06  |
| IAM-03 | Login and current-user restoration        | `/login`; login/me endpoints; localStorage JWT/user cache       | `/login`; Better Auth secure-cookie session and role-aware redirect                       | IMPLEMENTED | B-04, B-05  |
| IAM-04 | Logout and session expiry                 | auth logout; Axios 401 interceptor; token-expiry event; polling | server/client logout, expiry handling, cross-tab behavior                                 | IMPLEMENTED | B-04, B-05  |
| IAM-05 | Forgot/reset password flow                | `/forgot-password`; forgot/reset endpoints                      | Non-enumerating Better Auth reset-link request and token-based reset form                 | IMPLEMENTED | B-04, B-06  |
| IAM-06 | Roles: user, employee, admin, super-admin | user model and auth middleware                                  | centralized server-side policy module plus UI capability checks                           | IMPLEMENTED | B-05        |
| IAM-07 | Fine-grained permissions                  | nine `permissions.can*` fields and `hasPermission` middleware   | typed permission registry enforced server-side                                            | IMPLEMENTED | B-05        |
| IAM-08 | HR definition and assigned-job scoping    | department checks, `isHR`, `checkJobAssignment`, `assignedJobs` | explicit HR/assignment policy with route-level enforcement                                | IMPLEMENTED | B-05, B-10  |
| IAM-09 | Employee status/eligibility               | active/inactive/former/suspended; review/recommendation guards  | explicit status policy preserving intended eligibility                                    | IMPLEMENTED | B-05, B-10  |

## Jobs and applications

| ID     | Domain / flow                                           | Legacy source                                              | Planned target                                                                                                                 | Status      | Blocker IDs      |
| ------ | ------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------- |
| JOB-01 | Create/edit/manage job                                  | `/jobs/create`, `/jobs/edit/:id`; job CRUD; Cloudinary     | `/recruitment/jobs`; protected create/edit, publication/active controls, validated public Cloudinary image replacement/removal | IMPLEMENTED | B-07, B-09       |
| JOB-02 | Job publication/active state and unique slug generation | job schema/controllers and migration scripts               | canonical collision-safe slug rules plus deterministic dry-run/apply publication and slug backfill                             | IMPLEMENTED | B-02, B-09       |
| JOB-03 | Custom application questions                            | text, multipleChoice, checkbox, file, rating; CRUD/reorder | job editor question builder and typed answer schema                                                                            | IMPLEMENTED | B-07, B-10       |
| APP-01 | Authenticated application submission                    | `/apply/:slug`; multipart application endpoints            | `/apply/[identifier]`; authenticated multi-step TanStack Form, Zod, duplicate protection, validated multipart handling         | IMPLEMENTED | B-02, B-07, B-10 |
| APP-02 | Resume upload and access                                | Cloudinary resume fields; resume-access endpoint           | Private Cloudinary upload and assignment-authorized, short-lived signed resume redirect                                        | IMPLEMENTED | B-07, B-12       |
| APP-03 | Resume parsing/autofill                                 | parse-resume endpoint; PDF/DOC/DOCX extraction             | Synchronous bounded PDF (first 20 pages)/DOCX parser with 5 MB and 100k-text limits; legacy DOC remains unsupported            | IN_PROGRESS | B-07, B-11, B-13 |
| APP-04 | Application question answers and file answers           | upload-question-file; update answers                       | Embedded typed answers and private question-file uploads with server required-field validation                                 | IMPLEMENTED | B-07, B-10, B-12 |
| APP-05 | Candidate “My Applications” and status checks           | `/my-applications`; my/check-status/check-statuses         | `/my-applications`; server-rendered ownership-filtered list and status API                                                     | IMPLEMENTED | B-05, B-10       |
| APP-06 | Application detail and resume access                    | `/applications/:id`; detail/resume-access endpoints        | `/recruitment/applications/[identifier]`; role, permission, assignment policy and signed resume access                         | IMPLEMENTED | B-05, B-12       |
| APP-07 | HR application lists and dashboard statistics           | all/job lists and dashboard/stats                          | `/recruitment`; scoped lists and aggregate dashboard                                                                           | IMPLEMENTED | B-05, B-10       |
| APP-08 | Status workflow                                         | pending → reviewing → shortlisted/rejected/offered/hired   | Strict forward transition service with optimistic concurrency and audit                                                        | IMPLEMENTED | B-10             |
| APP-09 | Rejection and welcome-email actions                     | reject/welcome endpoints                                   | persistent idempotency claims, bounded delivery attempts, retry timing, delivery result and audit                              | IMPLEMENTED | B-06, B-10       |

## Offers, contracts, certificates, and documents

| ID     | Domain / flow                                       | Legacy source                                   | Planned target                                                                                                                                          | Status      | Blocker IDs      |
| ------ | --------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------- |
| DOC-01 | Generate offer from application                     | application offer endpoint; offer-letter model  | transactional offer service linking application and offer                                                                                               | IMPLEMENTED | B-06, B-08, B-10 |
| DOC-02 | Manual offer issue and list/detail                  | `/offer-letters`; issue/list/detail endpoints   | `/recruitment/offers`; permission-protected typed issue form, list, and API                                                                             | IMPLEMENTED | B-05, B-08       |
| DOC-03 | Bulk offer issue and sample CSV                     | bulk upload/sample endpoints                    | permission-protected bounded CSV import with quoted fields, row-level report, and formula-safe downloadable template                                    | IMPLEMENTED | B-08, B-12       |
| DOC-04 | Offer PDF generation/download/email                 | PDFKit, QR code, fonts/logo, Nodemailer         | authorized deterministic PDF generation/download, verification QR, and idempotency-tracked attachment delivery                                          | IMPLEMENTED | B-06, B-08, B-13 |
| DOC-05 | Offer status, extension history, token regeneration | status/extend/regenerate/add-token endpoints    | audited final status transition, snapshot-backed extensions, and hashed response-token rotation                                                         | IMPLEMENTED | B-04, B-08, B-10 |
| DOC-06 | Public offer accept/reject                          | `/offer/accept/:jobSlug/:slug`; token endpoints | `/offer/respond/[token]`; hashed one-time token validation, expiry, atomic accept/reject, redacted public projection                                    | IMPLEMENTED | B-04, B-10, B-12 |
| DOC-07 | Contract personal/bank/employment/legal submission  | contract controller/model                       | token-bound multi-step form after offer acceptance; AES-256-GCM encrypted bank/identity values; one-time atomic submission                              | IMPLEMENTED | B-10, B-12       |
| DOC-08 | Contract document upload                            | contract upload endpoint; Cloudinary            | authenticated private Cloudinary upload with 8 MB limit, MIME allowlist, magic-byte checks, cleanup, and protected signed access                        | IMPLEMENTED | B-07, B-12       |
| DOC-09 | HR contract list/detail/status workflow             | contract list/detail/status endpoints           | `/recruitment/contracts`; assignment-aware permission checks, redacted projections without reveal endpoint, controlled transitions, comments, and audit | IMPLEMENTED | B-05, B-10       |
| DOC-10 | Contract PDF generation                             | contract PDF endpoint                           | deterministic, permission-protected, no-store PDF with sensitive values masked and download audit                                                       | IMPLEMENTED | B-08, B-13       |
| DOC-11 | Certificate issue/list                              | `/certificates`; issue/list endpoints           | `/recruitment/certificates`; permission-protected typed issuance and list API                                                                           | IMPLEMENTED | B-05, B-08       |
| DOC-12 | Certificate PDF/QR/download/email                   | CertificateController PDFKit/QR/Nodemailer      | deterministic safe-field PDF/download, verification QR, and idempotency-tracked attachment delivery                                                     | IMPLEMENTED | B-06, B-08, B-13 |

## People, HR, recommendations, reviews, notifications, and audit

| ID     | Domain / flow                                    | Legacy source                                             | Planned target                                                                                                                           | Status      | Blocker IDs      |
| ------ | ------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------- |
| PPL-01 | User/employee list and detail                    | `/admin/users`, `/admin/employees`; users endpoints       | `/admin/users`, `/admin/employees`; paginated server queries                                                                             | IMPLEMENTED | B-05, B-10       |
| PPL-02 | Employee status/account status/termination       | status, account-status, terminate, bulk-status endpoints  | controlled lifecycle plus bounded bulk status/email actions, session revocation, self/last-admin guards, idempotent delivery, and audit  | IMPLEMENTED | B-05, B-06, B-10 |
| PPL-03 | Bulk employee CSV upload and welcome credentials | bulk-upload and welcome email                             | bounded permission-protected CSV import with row report, rollback on mail failure, and secure reset link rather than exposed password    | IMPLEMENTED | B-04, B-06, B-12 |
| PPL-04 | Role changes and user deletion                   | super-admin endpoints                                     | super-admin-only mutations with self-lockout safeguards                                                                                  | IMPLEMENTED | B-05, B-10       |
| PPL-05 | Employee profile                                 | `/employee/profile`                                       | `/employee/profile`; employee/former-employee-only managed data view                                                                     | IMPLEMENTED | B-05             |
| HR-01  | HR create/list/revoke                            | `/admin/manage-hr`; HR routes                             | `/admin/hr`; super-admin policy                                                                                                          | IMPLEMENTED | B-05             |
| HR-02  | HR permissions and assigned jobs                 | HR permissions/jobs routes                                | permission matrix and assignment editor                                                                                                  | IMPLEMENTED | B-05, B-10       |
| REC-01 | Employee recommendations create/list/delete      | recommendation employee endpoints                         | `/employee/recommendations`; employee-only ownership rules                                                                               | IMPLEMENTED | B-05, B-10       |
| REC-02 | Recommendation admin moderation/stats/linking    | `/admin/recommendations`; all/status/stats/link endpoints | permission-protected moderation, application linking, grouped counts, and selection rate                                                 | IMPLEMENTED | B-05, B-10       |
| REV-01 | Public approved reviews                          | approved endpoint and Home review list                    | server-render approved reviews                                                                                                           | IMPLEMENTED | B-03, B-10       |
| REV-02 | Eligible employee review submission/my review    | `/reviews/submit`; eligibility/my/submit                  | `/employee/review`; active/former employee policy and single-submission invariant                                                        | IMPLEMENTED | B-05, B-10       |
| REV-03 | Review moderation                                | `/admin/reviews`; pending/all/approve/reject/update       | `/admin/reviews`; permission and audit enforcement                                                                                       | IMPLEMENTED | B-05, B-10       |
| NOT-01 | User notification list/count/read/delete         | `/notifications`; notification context/service            | `/notifications`; ownership-filtered list, unread count, read/all-read, delete                                                           | IMPLEMENTED | B-05, B-10       |
| NOT-02 | Job/application/system notification generation   | notification model and controller side effects            | transactional idempotent application/job notification generation with durable outbox-lite event records; system producers remain pending | IN_PROGRESS | B-10, B-13       |
| NOT-03 | Admin notification visibility                    | admin/all endpoint                                        | retained permission-protected recent notification API/view with recipient visibility                                                     | IMPLEMENTED | B-05, B-10       |
| AUD-01 | Audit recording and super-admin log view         | audit service/model; `/admin/audit-logs`; audit routes    | immutable audit service and redacted super-admin `/admin/audit-logs`                                                                     | IMPLEMENTED | B-05, B-10, B-12 |

## Platform and operational parity

| ID     | Domain / flow                         | Legacy source                                           | Planned target                                                                                                                                          | Status      | Blocker IDs |
| ------ | ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- |
| OPS-01 | MongoDB connection and indexes        | Mongoose config/models/indexes                          | selected target data layer with preserved IDs, relations, uniqueness, indexes                                                                           | NOT_STARTED | B-02        |
| OPS-02 | API compatibility and error envelopes | Express `/api/*`; Axios assumptions                     | Next route handlers or compatibility facade with contract tests                                                                                         | IN_PROGRESS | B-01, B-02  |
| OPS-03 | CORS, security headers, compression   | Express global middleware                               | strict security headers and configured same-origin API CORS rejection/credential response policy; deployment compression proof pending                  | IN_PROGRESS | B-01, B-12  |
| OPS-04 | Rate limiting                         | process-local 100/15-minute limiter outside development | shared/distributed limiter by route sensitivity                                                                                                         | IN_PROGRESS | B-12, B-13  |
| OPS-05 | Health endpoint                       | `GET /api/health`                                       | `/api/health` with liveness/readiness distinction                                                                                                       | IMPLEMENTED | B-01        |
| OPS-06 | Email delivery and templates          | multiple Nodemailer transports/templates                | centralized adapter plus persistent delivery idempotency, attempt/provider/error tracking and bounded retry abstraction; worker/provider policy pending | IN_PROGRESS | B-06, B-13  |
| OPS-07 | Media/object lifecycle                | Cloudinary uploads/deletes/signed access                | public job images, private documents, replacement/rollback cleanup and authenticated signed access; scheduled orphan reconciliation pending             | IN_PROGRESS | B-07, B-12  |
| OPS-08 | Logging and production error handling | custom logger/global Express handler                    | structured logging, correlation IDs, redaction, error boundaries                                                                                        | IN_PROGRESS | B-12, B-13  |
| OPS-09 | Seed and data migration scripts       | seeds and role/status/slug/publication scripts          | deterministic dry-run-by-default job slug/publication backfill with explicit apply mode; broader migration rehearsal pending                            | IN_PROGRESS | B-02, B-09  |
| OPS-10 | SEO metadata and canonical URLs       | React Helmet usage, sitemap, route slugs                | Next metadata API, canonical URLs, robots/sitemap                                                                                                       | IMPLEMENTED | B-03, B-09  |

## Blocker register

Blockers are tracked separately from feature status. A feature remains `NOT_STARTED` until work begins; it becomes `BLOCKED` only when implementation has started and cannot proceed.

| ID   | Blocker / decision required                                                                                                      | Resolution evidence                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| B-01 | Decide deployment topology: one Next application, separate API, or temporary compatibility proxy.                                | Approved architecture decision and environment topology.        |
| B-02 | Choose target data access strategy and prove compatibility with existing MongoDB documents, IDs, indexes, and references.        | Data ADR plus rehearsal report and rollback procedure.          |
| B-03 | Approve information architecture, visual parity tolerance, metadata, and redirects.                                              | Route map and approved visual baselines.                        |
| B-04 | Select session/token design; legacy browser localStorage bearer tokens should not be copied without security review.             | Authentication ADR and threat model.                            |
| B-05 | Reconcile overlapping role, department, status, permission, and assigned-job rules between UI and middleware.                    | Single authorization policy table approved by product/security. |
| B-06 | Select email provider/sender configuration and delivery, retry, idempotency, and test-inbox strategy.                            | Mail ADR and sandbox acceptance evidence.                       |
| B-07 | Decide public media versus private sensitive-document storage, signed access, deletion, size, and MIME policy.                   | Storage ADR and security tests.                                 |
| B-08 | Freeze PDF/QR/CSV output contracts and asset/font licensing/deployment behavior.                                                 | Golden fixtures and approved document samples.                  |
| B-09 | Define canonical slug/ID behavior, collision rules, publication defaults, and redirects for existing links.                      | URL/data migration specification.                               |
| B-10 | Resolve workflow invariants and legal transitions for applications, offers, contracts, reviews, recommendations, and employment. | State-transition specifications and product sign-off.           |
| B-11 | Decide whether resume parsing is synchronous, queued, or optional and establish runtime/resource limits.                         | Parsing ADR and load-test budget.                               |
| B-12 | Complete security/privacy review for PII, bank details, identity documents, audit data, uploads, and secrets.                    | Threat model, retention policy, and security approval.          |
| B-13 | Select background-work, observability, retry, and distributed coordination infrastructure.                                       | Operations ADR and failure-mode tests.                          |
| B-14 | Establish accessibility target and browser/device support matrix.                                                                | WCAG target and supported-browser policy.                       |

## Update rules

1. Update one row per independently testable capability.
2. Record implementation PR/commit and test evidence when changing status.
3. `IMPLEMENTED` means target behavior exists but parity proof is incomplete.
4. `VERIFIED` requires all applicable automated, visual, role, security, accessibility, and cross-app parity gates from `15-test-parity-plan.md`.
5. A blocker is never hidden in notes; reference its blocker ID and update the blocker register.
