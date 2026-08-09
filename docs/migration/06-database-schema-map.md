# 06 — Database Schema and Mongoose-to-Prisma Map

Provider must be Prisma `mongodb`. Every root ID requires `String @id @default(auto()) @map("_id") @db.ObjectId`; every stored ObjectId scalar requires `@db.ObjectId`; preserve collection names with `@@map`.

## Collection overview

| Model              | Collection            | Key relations/structures                                      |
| ------------------ | --------------------- | ------------------------------------------------------------- |
| User               | `users`               | roles, permissions composite, `assignedJobs[]`, offer pointer |
| Job                | `jobs`                | poster, HR contact, embedded questions with `_id`             |
| Application        | `applications`        | job/user/recommendation/offer, embedded mixed answers         |
| OfferLetter        | `offerletters`        | user/application/contract, snapshots, token, PDF bytes        |
| EmploymentContract | `employmentcontracts` | offer unique, application, nested PII/bank/workflow/documents |
| Certificate        | `certificates`        | issuer user                                                   |
| Recommendation     | `recommendations`     | recommender/candidate/job/application/reviewer                |
| Review             | `reviews`             | reviewer user, moderation users                               |
| Notification       | `notifications`       | user/job/application, details, JSON metadata                  |
| AuditLog           | `auditlogs`           | actor plus polymorphic resource ID/entity                     |
| TestContract       | `testcontracts`       | unused artifact; confirm live collection before target model  |

## Model details

### User (`models/user.js`)

Fields: `name` required; `email` required unique; optional `phoneNumber`; `password` required and Mongoose `select:false`; role enum `user|admin|employee|super-admin` default user; optional permissions object with nine `can*` booleans default false; `assignedJobs ObjectId[]`; status `active|inactive|former|suspended` default active; positionLevel `Junior|Senior|Lead|Manager|Director`; verification/reset OTPs and expiries; optional undefined-model `moreInfo`; offer pointer; department/position/reportingManager; unique sparse employeeId; termination fields; `createdAt` only. Indexes: unique email, unique sparse employeeId.

### Job (`models/job.js`)

Unique sparse indexed slug; required title/company/description; requirements/responsibilities arrays; location; type enum `Full-time|Part-time|Contract|Internship`; salary string; department/position/reportingManager; image/public ID; postedBy; active/published flags; HR-contact object; questions array with implicit `_id`, text, type `text|multipleChoice|checkbox|file|rating`, required/options/maxRating/order; manual created/updated dates. Includes active/published/date compound indexes and a Mongo text index not reproducible by ordinary Prisma schema syntax.

Pre-validate hook creates unique lowercase slug with alphabetical suffix. Reimplement in domain service with unique-index retry.

### Application (`models/application.js`)

Unique sparse slug; required jobId/fullName/email/phone; optional userId; legacy resume plus URL/public ID; experience/education/skills/cover letter; referral flag/recommendation; embedded answers with `_id`, questionId, text/type, `answer Mixed`, file URL/public ID; status enum `pending|reviewing|shortlisted|rejected|offered|hired`; offer path/id; manual dates. Indexes on job/user/email/status/date and compounds. Slug hook mirrors Job.

Use `Json?` for answer. `questionId` points to embedded Job question and cannot be a normal Prisma relation. Code writes undeclared referral fields; profile live data before deciding optional target fields.

### OfferLetter (`models/offerLetter.js`)

Optional user/application IDs; required candidate/email/position/department/salary/startDate/validUntil; offer/work/payout/duration/location/benefit/reporting/company/HR fields; status `Pending|Accepted|Rejected`; unique sparse shortId and acceptanceToken; additional notes; embedded extension history with ObjectId, dates, notes, mixed snapshots and extender; timestamps; acceptance/rejection metadata; contractId; optional Buffer PDF and generation date.

`userId` is semantically ambiguous (issuer in some flows, recipient in others). `contractId` names nonexistent Mongoose model `Contract`; map actual relationship to `employmentcontracts` only after data profiling. Snapshots are `Json?`; buffer is `Bytes?`.

### EmploymentContract (`models/offerContract.js`)

Unique required offerLetterId; required applicationId, candidate/email/phone; nested required personal address/emergency/identity details; required banking account fields; required employment fields; status `Draft|Under_Review|Approved|Rejected|Requires_Clarification`; nested workflow stage objects; embedded documents with `_id`, type enum, filename/URL/public ID/date; agreement terms; reviewer/comments; timestamps. Indexes: offer unique, email, status, date.

Treat banking, government ID and documents as sensitive server-only fields. Existing manual/bulk flows can create partial offer state because contract validation fails; make uncertain fields optional in the first compatibility schema until live profiling/backfill.

### Recommendation

Required recommender ObjectId/employee ID, recommended user/email/name, job; status `pending|reviewed|selected|rejected`; messages max 500; reviewer/date/application; manual dates. Compound indexes. Static pending-count method must become service query. No DB uniqueness for duplicates.

### Review

Required user/email/name/rating 1–5/title/content/reviewerType; optional work/details/pros/cons/advice; status moderation fields and timestamps. reviewerType `employee|offer_recipient`. Indexes on status/date, user, rating. One-per-user is controller-only. Seed emits invalid `candidate` values.

### Notification

Required user/type/title/message; type `job_update|application_status|system`; job/application refs; read fields; embedded job-change detail; priority; `metadata Mixed`; timestamps and user/read/type/job indexes. Map metadata to `Json`. Reimplement `markAsRead` and static job-update factory.

### AuditLog

Required actor/role/action/resourceEntity; optional polymorphic resourceId, `changes Mixed`, IP, agent, created date. Keep `resourceEntity` + raw ObjectId and resolve manually; Prisma cannot model a polymorphic relation. Add reviewed time/entity/action indexes without changing stored fields.

### Certificate

Optional issuer `userId`; required name/domain/jobrole/fromDate/toDate; recipient email, issuedBy/date. No timestamps option/index. Controllers sort nonexistent `createdAt`; preserve observed runtime rather than assuming it.

## Prisma compatibility rules

- Use composite types for permissions, HR contact, questions, answers, extension history, contract nested data/documents and notification details.
- Include embedded `_id` fields, especially Job questions referenced by Application answers.
- Use mapped Prisma enum identifiers for stored punctuation/casing (`super-admin`, `Full-time`, `On-site`, etc.).
- Preserve uncertain/missing legacy values initially as optional; tighten only after profiling/backfill.
- Prisma does not carry Mongoose hooks, methods, `select:false`, min/max validation, publication fallback, soft delete or audit behavior. Reimplement explicitly in Zod/domain services/query projections.
- Existing Mongo text index should be externally managed and documented.
- Do not rename fields/collections or regenerate slugs during initial compatibility migration.

## Better Auth compatibility

Existing passwords are bcrypt cost 10 in `users.password`; Better Auth defaults to scrypt and credential passwords in Account records. To preserve users:

1. Configure custom bcrypt verify/hash, optionally rehash to selected algorithm after successful login.
2. Create Better Auth credential Account records linked to existing ObjectId users and copy hashes exactly.
3. Ensure Better Auth-generated IDs are valid ObjectIds where Prisma fields use `@db.ObjectId`.
4. Map Better Auth email verification to existing `isEmailVerified`; backfill required `updatedAt` if needed.
5. Mark role/permissions/status/assignedJobs server-controlled.
6. Existing JWTs and in-flight OTPs are not Better Auth sessions/verifications; decide hard re-login vs temporary bridge and invalidate/resend OTPs.

## Required read-only live-data checks

Verify actual collections/indexes/counts; missing/null/BSON type distributions; all distinct enum-like values; legacy fields/roles/statuses; duplicate emails/IDs/slugs/tokens; dangling and disagreeing bidirectional references; embedded IDs; offer `userId` semantics; accepted offers without contracts; password prefixes; alternate database names (`connectsphere` vs `careers_job_portal`). No schema is final until these checks pass.
