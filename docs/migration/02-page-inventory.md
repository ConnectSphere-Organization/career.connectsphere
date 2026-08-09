# 02 — Page Inventory

All source paths are relative to `mern/frontend/src`. Status is analysis-only; migration state is tracked in `09-feature-parity-matrix.md`.

| Route                                | Source                                                        | Audience                                | Core behavior and states                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                  | `pages/Home.jsx`, `components/hero/HeroSection.jsx`           | Public                                  | Hero, company sections, benefits, hiring steps, approved-review carousel; review API failure collapses into empty state.                   |
| `/login`                             | `pages/Login.jsx`                                             | Public                                  | Email/password login, requested-route redirect, loading/error feedback.                                                                    |
| `/register`                          | `pages/Register.jsx`                                          | Public                                  | Name/email/phone/password/confirm; verification handoff.                                                                                   |
| `/verify-email`                      | `pages/EmailVerification.jsx`                                 | Public with navigation state            | Six-digit OTP, resend, auto-login behavior; direct entry lacks required email state.                                                       |
| `/forgot-password`                   | `pages/ForgotPassword.jsx`                                    | Public                                  | Email OTP request and password reset stages.                                                                                               |
| `/jobs`                              | `pages/JobsList.jsx`                                          | Public + staff actions                  | Search, type filter, date/salary sort, mobile filter sheet, application status, publish/edit/delete controls, skeleton/empty/modal states. |
| `/jobs/create`                       | `pages/JobDashboard.jsx`                                      | AdminRoute                              | Create details/image/contact and then questions.                                                                                           |
| `/jobs/edit/:id`                     | `pages/JobDashboard.jsx`                                      | AdminRoute                              | Details, question builder/reorder, applicant table/status filter.                                                                          |
| `/apply/:slug`                       | `pages/Apply.jsx`                                             | PrivateRoute                            | Four-step application, resume parsing/autofill, custom question types/files, CAPTCHA, multipart submit.                                    |
| `/my-applications`                   | `pages/MyApplications.jsx`                                    | PrivateRoute                            | Candidate cards, expandable details, resume access, answers, offers/download, job-update banners.                                          |
| `/applications/:id`                  | `pages/ApplicationDetail.jsx`                                 | PrivateRoute (too broad)                | Candidate/job/answers/offer/contract detail, CSV, resume, status, offer, reject, hire actions; displays highly sensitive onboarding data.  |
| `/dashboard`                         | `pages/Dashboard.jsx`                                         | AdminRoute                              | Statistics, status distribution, top jobs and recent applications; date-range state has no rendered control.                               |
| `/notifications`                     | `pages/NotificationsPage.jsx`                                 | PrivateRoute                            | All/unread/read filter, paging, mark read/all, delete; read filter currently behaves like all.                                             |
| `/certificates`                      | `pages/Certificates.jsx`                                      | AdminRoute                              | Tabbed certificate issue/list/verify and offer issue/list management.                                                                      |
| `/offer-letters`                     | `pages/OfferLetters.jsx`                                      | AdminRoute                              | Parallel/older offer management surface.                                                                                                   |
| `/verify`, `/verify/:id`             | `pages/VerifyCertificate.jsx`                                 | Public                                  | Manual/automatic certificate lookup, success/error details.                                                                                |
| `/verify-offer`, `/verify-offer/:id` | `pages/VerifyOfferLetter.jsx`                                 | Public                                  | Manual/automatic offer lookup.                                                                                                             |
| `/offer/accept/:jobSlug/:slug`       | `pages/OfferAcceptance.jsx`                                   | Public                                  | Offer review/accept/reject; personal, emergency, identity, bank, consent data. Loading/fetch failure can leave blank UI.                   |
| `/contact`                           | `pages/Contact.jsx`                                           | Public                                  | Contact form; target backend endpoint absent in source.                                                                                    |
| `/reviews/submit`                    | `pages/SubmitReview.jsx`, `components/reviews/ReviewForm.jsx` | EmployeeRoute                           | Eligibility/existing review check and rating/content/pros/cons/advice form.                                                                |
| `/employee/profile`                  | `pages/EmployeeProfile.jsx`                                   | EmployeeRoute                           | Recommendation history, eligible application lookup, create/delete pending referral.                                                       |
| `/admin/reviews`                     | `components/reviews/AdminReviewManagement.jsx`                | AdminRoute                              | Filter/sort/page reviews, view/approve/reject dialogs.                                                                                     |
| `/admin/users`                       | `pages/admin/UserManagement.jsx`                              | AdminRoute                              | Candidate search/status/page, detail, status update, super-admin delete.                                                                   |
| `/admin/employees`                   | `pages/admin/EmployeeManagement.jsx`                          | AdminRoute                              | Staff filters/stats/edit/terminate/delete, certificate/offer history, CSV import/export.                                                   |
| `/admin/recommendations`             | `pages/admin/RecommendationManagement.jsx`                    | AdminRoute                              | Stats, search/filter/page, review/select/reject/link.                                                                                      |
| `/admin/manage-hr`                   | `pages/admin/ManageHR.jsx`                                    | AdminRoute + internal super-admin check | Promote/revoke HR, permissions, assigned jobs, HR audit.                                                                                   |
| `/admin/audit-logs`                  | `pages/admin/AuditLogs.jsx`                                   | AdminRoute (backend super-admin)        | Entity/action filters, load-more records, raw change detail modal.                                                                         |
| `*`                                  | `pages/Home.jsx`                                              | Public                                  | Unknown routes silently render Home rather than 404.                                                                                       |

## Missing or broken destinations

- `/applications` and `/jobs/:id` are linked but not routed.
- `/profile` exists in navigation but only `/employee/profile` exists.
- `/TermsAndConditions`, `/privacypolicy`, and `/test/job` are linked but absent.
- Notification/application deep links can send candidates to recruiter-only details.
- `jobSlug` in the offer acceptance route is presentation-only in current fetch logic.

## Shared layout parity

- Fixed top navbar at all widths; desktop menu from `md`, fixed bottom navigation below `md`.
- Footer hidden for login, register and application pages.
- Mobile bottom bar uses safe-area padding and may obscure pages lacking bottom spacing.
- Tables generally remain wide with horizontal scrolling.
- Global toast, route Suspense loader and render error boundary.

## Required target route groups

- `(public)`: home, jobs, contact, public verification.
- `(auth)`: login, register, verification, recovery.
- `(candidate)`: apply, applications, notifications.
- `(employee)`: profile, review, recommendations.
- `(admin)`: dashboard, jobs, applications, documents, people, HR, moderation, audit.

Route groups must not replace server authorization. Every target page and mutation needs explicit role, permission, ownership and assignment policy.
