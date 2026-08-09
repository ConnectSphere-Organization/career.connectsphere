# 05 — API Inventory

Detailed controller behavior is derived from `mern/backend/Routes`, `Controllers`, middleware and frontend `src/services/api.js`. Target codes: **RH** Route Handler, **RSC** direct server read, **DS** internal domain service. Existing externally observable contracts should remain RH until parity tests approve changes.

## Authentication — `/api/auth`

| Method/path                                  | Existing access/input/output/side effects                                                                                                        | Target                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `POST /register`                             | Public; name/email/password/optional role/phone. Creates bcrypt user, plaintext OTP, email, audit; 201. Caller role is a critical vulnerability. | Better Auth RH + DS; force candidate role.     |
| `POST /login`                                | Public email/password; verified email required; returns JWT/user and sets unused cookie.                                                         | Better Auth handler; secure session cookie.    |
| `POST /verify-email`, `/resend-verification` | Email + OTP/resend; user-enumerating errors and email side effect.                                                                               | Better Auth verification flow.                 |
| `POST /forgot-password`, `/reset-password`   | Email OTP and new password; no attempt limits.                                                                                                   | Better Auth reset flow with generic responses. |
| `GET /me`, `/logout`                         | Bearer auth; current user / cookie clear.                                                                                                        | Session API/RSC; compatible RH if needed.      |
| `GET /users`                                 | `canManageEmployees`; minimal user list.                                                                                                         | DS/RSC or protected RH.                        |
| `GET /admin-data`, `/user-data`              | Demo protected data.                                                                                                                             | Remove only after runtime non-usage proof.     |

## Jobs — `/api/jobs`

| Endpoints                                           | Existing behavior                                                                                                       | Target                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `GET /`, `/featured`, `/search`, `/filter`, `/sort` | Public/optional auth; publication filters, application statuses, regex search, string salary filtering, arbitrary sort. | RSC for pages + compatibility RH; typed query schemas and bounded sort. |
| `GET /:id`, `/:jobId/questions`                     | ID or slug; unpublished access for managers.                                                                            | RSC/RH + DS; canonical identifier resolver.                             |
| `POST /`, `PUT /:id`, `DELETE /:id`                 | Permission/assignment checks; image upload; soft delete; broad update body; audit; applicant notifications.             | RH + job DS; Zod allowlist, private media adapter, outbox.              |
| Question POST/PUT/DELETE/reorder                    | Permission + assignment; embedded subdocuments.                                                                         | RH or Server Actions + job DS; preserve embedded IDs/order.             |

## Applications — `/api/applications`

| Endpoints                                                                  | Existing behavior                                                                       | Target                                                                 |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `POST /submit`                                                             | Public multipart legacy submission; no CAPTCHA/duplicate protection/user link.          | Compatibility RH only if external usage proven; secure abuse controls. |
| `POST /`                                                                   | Auth multipart; CAPTCHA, phone check, reapplication after rejection, Cloudinary resume. | RH + application DS + Zod.                                             |
| `POST /parse-resume`                                                       | Auth upload, synchronous heuristic parser.                                              | RH/background DS based on ADR.                                         |
| `POST /upload-question-file`                                               | Auth upload; broad types; unattached file possible.                                     | RH + private attachment service.                                       |
| `GET /my`, `/my/:id/offer-letter`                                          | Candidate-owned applications/offer.                                                     | RSC + candidate DS; compatibility RH.                                  |
| `GET /for-recommendation`                                                  | Any authenticated user; leaks eligible candidate data and uses invalid `under_review`.  | Protected employee DS after policy correction.                         |
| `GET /check-status/:jobId`, `/check-statuses`                              | Candidate application status map.                                                       | RSC/RH; ID/slug-compatible query.                                      |
| `GET /:id/resume-access`                                                   | Owner/admin/assigned HR signed URL.                                                     | Protected RH with private storage.                                     |
| `PUT /:applicationId/answers`                                              | Auth only; currently no ownership check.                                                | RH + ownership/assignment policy.                                      |
| `GET /dashboard/stats`, `/`, `/job/:jobId`, `/:id/detail`                  | HR/admin statistics/lists/detail; assignment scope inconsistent.                        | RSC/RH + centralized policy.                                           |
| `PUT /:id/status`                                                          | Broad HR/admin; status and user side effects; audit.                                    | RH + transition service.                                               |
| `POST /:id/offer`, `GET /:id/offer-letter`, `POST /:id/reject`, `/welcome` | Offer/email/status actions; assignment and identifier handling inconsistent.            | RH + transactional/idempotent DS and outbox.                           |

## Certificates and offers — `/api/certification`

- Certificates: `POST /issue`, `GET /`, `GET /verify/:id`, `GET /download/:id`, `POST /:id/send-email`.
- Offers: `POST /issue-offer`, `POST /bulk-issue-offer`, `GET /bulk-sample-csv`, `GET /offer-letters`, `GET /offer-letters/:id`, `PATCH /offer-letters/:id/status`, `PATCH /offer-letters/:id/extend`, `GET /offer-letters/:id/download`, `POST /offer-letters/:id/send-email`, `POST /offer-letters/:id/regenerate-token`, `POST /offer-letters/add-tokens`, `GET /verify-offer/:id`.

Inputs include JSON offers or CSV; outputs include records/PDF blobs/CSV and IDs. Side effects include DB links, audit, PDF/QR and email. Target: protected RH + document DS, Zod, deterministic renderers, row-limited robust CSV parser, redacted public verification, ownership/permission checks, one-time tokens.

Frontend declares unsupported certificate CRUD and alternate `/api/offer-letters`; do not implement without observed-use evidence.

## Contracts — `/api/contracts`

| Endpoint                                                   | Existing behavior                                                                                                                      | Target                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET/POST /offer/accept/:slug`, `POST /offer/reject/:slug` | Public weak identifier; GET may return complete contract; acceptance performs non-atomic writes and may accept after contract failure. | One-time expiring-token RH + transactional workflow and redacted GET. |
| `POST /:contractId/upload`                                 | Public by ID; broken Cloudinary result mapping likely.                                                                                 | Token/session-bound private upload RH.                                |
| `GET /`, `/application/:applicationId`, `/:contractId`     | HR/admin list/detail.                                                                                                                  | Protected RSC/RH with field redaction.                                |
| `PUT /:contractId/status`                                  | HR/admin status/reviewer/email side effects.                                                                                           | Transition DS + audit/outbox.                                         |
| `GET /:contractId/pdf`                                     | Stub response only.                                                                                                                    | Blocked until output contract defined.                                |

## Reviews — `/api/reviews`

- Public `GET /approved` with filters/stats/pagination.
- Employee eligibility/my/submit: `GET /eligibility`, `GET /my-review`, `POST /submit`.
- Moderation: `GET /pending`, `GET /all`, `PUT /:id/approve`, `/reject`, `/update` under `canManageReviews`.

Target RSC/RH + review DS; enforce one-review invariant, bounded filters, clarified former/offer-recipient policy and audit moderation.

## Users and HR

### `/api/users`

`POST /bulk-upload`; `GET /`, `GET /:userId`; `PUT /:userId/status`, `/account-status`, `/terminate`, `/bulk/update-status`, `/:userId/role`; `DELETE /:userId`.

Existing inputs include search/filter/pagination and CSV. Side effects include role/status changes, offers/contracts, email and audit. Target protected RH/DS; Zod/CSV validation, super-admin authority for privileged roles, transactions, secure onboarding link, no plaintext temporary password.

### `/api/hr`

`GET /`, `POST /`, `PUT /:hrId/permissions`, `GET /audit-logs`, `GET /jobs`, `DELETE /:hrId`; all intended super-admin. Target protected RSC/RH + canonical permission registry and assignment validation.

## Recommendations — `/api/recommendations`

Employee: `POST /`, `GET /my-recommendations`, `DELETE /:id`. Admin: `GET /all`, `PUT /:id/status`, `GET /stats`, `POST /link-applications`.

Existing employee middleware mistakenly allows active candidates; linked writes are non-transactional. Target recommendation DS with strict employee eligibility, ownership, uniqueness/idempotency and transaction.

## Notifications and audit

- Notifications: `GET /`, `/count`, `PATCH /:id/read`, `/mark-all-read`, `DELETE /:id`, `GET /admin/all`.
- Audit: `GET /api/audit/logs` super-admin with page/limit/entity/action.

Target RSC/RH; ownership-safe notification mutations, event/outbox generation, immutable/redacted audit records and bounded pagination.

## Other

- `GET /`, `/api`, `/api/health`; health currently DB-dependent.
- `GET /api/sitemap.xml`; hard-coded frontend domain.
- No `POST /api/contact`, cron or webhook endpoints exist.

## Response and error compatibility risks

Frontend expects a mixture of bare arrays, `{user}`, `{job}`, `{data:{...}}`, binary blobs and already-unwrapped data. Before changing envelopes, capture contract fixtures. Standardized target errors must map validation/auth/authz/not-found/conflict/internal failures without exposing Prisma/provider details.
