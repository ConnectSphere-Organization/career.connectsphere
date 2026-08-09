# 03 — Component Inventory

Paths are relative to `mern/frontend/src/components`.

## Active shared/layout components

| Component                                  | Purpose                                                                              | Migration note                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `layout/Navbar.jsx`                        | Desktop top navigation, mobile bottom bar, permissions, notification badge, prefetch | Recreate exact responsive behavior; centralize capability mapping.                          |
| `layout/Footer.jsx`                        | Shared footer and links                                                              | Preserve layout; repair only through documented target difference for missing legal routes. |
| `PrivateRoute.jsx`                         | Authentication guard                                                                 | Replace with server-side `requireUser`.                                                     |
| `AdminRoute.jsx`                           | Admin-or-derived-HR guard                                                            | Too broad; replace with route-specific server policy.                                       |
| `EmployeeRoute.jsx`                        | Employee active/former guard                                                         | Preserve clarified eligibility policy.                                                      |
| `common/ErrorBoundary.jsx`                 | Render fallback                                                                      | Map to route/global `error.tsx`.                                                            |
| `common/Loader.jsx`, `common/Skeleton.jsx` | Loading states                                                                       | Recreate with Tailwind/shadcn primitives.                                                   |
| `common/ConfirmationModal.jsx`             | Destructive confirmation                                                             | Replace with accessible Radix AlertDialog.                                                  |

## Jobs and applications

- `JobQuestionManager.jsx`: create/edit/delete/reorder text, multiple choice, checkbox, file and rating questions.
- `JobQuestionAnswer.jsx`: candidate renderer for each question type.
- `ApplicationQuestionAnswers.jsx`: standalone answer display; main detail page implements alternative rendering.
- `ApplicationOfferForm.jsx`: recruiter offer-generation modal and form.

Preserve embedded question IDs because application answers refer to `Job.questions._id`.

## Dashboard

- `dashboard/DashboardStat.jsx`
- `dashboard/StatusDistribution.jsx`
- `dashboard/TopJobs.jsx`
- `dashboard/RecentApplicationsTable.jsx`

`DashboardStat` constructs Tailwind classes dynamically; target must use explicit class maps so production CSS is deterministic.

## Certificates and offers

- `certificates/IssueForm.jsx`
- `certificates/CertificateList.jsx`
- `certificates/VerifyForm.jsx`
- `certificates/OfferLetterForm.jsx`
- `certificates/OfferDetailsFormFields.jsx`
- `certificates/OfferLetterList.jsx`
- `certificates/ExtendOfferModal.jsx`
- `certificates/BulkOfferModal.jsx`
- `offerletters/VerifyOfferLetterForm.jsx`

The `/certificates` and `/offer-letters` surfaces overlap. They remain separate parity items until runtime usage and product approval permit consolidation.

## Reviews

- `reviews/ReviewForm.jsx`: rich employee review form.
- `reviews/AdminReviewManagement.jsx`: filters, pagination and moderation dialogs.
- `reviews/ReviewList.jsx`: complete public listing but not routed by active app.

## Notifications

- `notifications/NotificationBadge.jsx`: active navbar polling badge.
- `notifications/JobUpdateBanner.jsx`: candidate job-change alert.
- `notifications/JobUpdateNotificationCard.jsx`: change details.
- `notifications/NotificationSummary.jsx`: unused.
- `common/NotificationBell.jsx`: unused alternative.

`contexts/NotificationContext.jsx` contains a fuller reducer/polling implementation but is not mounted.

## Legacy, duplicate or incomplete artifacts

| File                                        | Finding                                              |
| ------------------------------------------- | ---------------------------------------------------- |
| `layout/SessionStatus.jsx`                  | Unused; references undefined values and would throw. |
| `layout/Header.jsx`                         | Empty.                                               |
| `../components/Footer.jsx`                  | Obsolete duplicate footer.                           |
| `common/MessageModal.jsx`                   | Empty.                                               |
| `certificates/OfferLetterFormNew.jsx`       | Empty.                                               |
| `OfferLetterErrorBoundary.jsx`              | Unused.                                              |
| `OfferForm.jsx`, `RejectionForm.jsx`        | Older Bootstrap-style forms.                         |
| `OfferLetterStatus.jsx`                     | Apparently unused.                                   |
| `provides/Test.jsx`, `provides/TestJob.jsx` | Unrouted prototypes importing legacy `App.css`.      |

Do not migrate dead artifacts blindly. Record runtime evidence before classifying a behavior as removable.

## State and utility inventory

- `contexts/AuthContext.jsx`: session restoration, role flags, auth actions.
- `contexts/NotificationContext.jsx`: dormant notification reducer/polling.
- `hooks/usePermissions.js`: permission and assigned-job checks.
- `hooks/useAuth.js`: duplicate accessor alongside context export.
- `hooks/useCenterMessage.js`: empty.
- `utils/cache.js`: nonpersistent TTL `Map` used for jobs.
- `utils/loadingTracker.js`: inactive tracked-fetch counter.
- `services/api.js`: Axios clients and all frontend contracts.

## Target component rules

- Use shadcn/Radix as accessible primitives, then customize tokens to visual parity.
- Keep domain components under `src/modules/<domain>/components` and genuinely shared components under `src/components/shared`.
- Prefer Server Components; add `use client` only for forms, browser state, Query, Zustand, Motion or events.
- Replace native `alert`, `confirm`, and `prompt` with accessible dialogs while preserving outcomes.
- Do not migrate alternate/dead components unless characterization proves active behavior.
