# 04 — Route Inventory

## Frontend routes

See `02-page-inventory.md` for complete page behavior. Existing route declarations are in `mern/frontend/src/App.jsx`.

| Group            | Routes                                                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public           | `/`, `/login`, `/register`, `/forgot-password`, `/verify-email`, `/jobs`, `/verify[/:id]`, `/verify-offer[/:id]`, `/contact`, `/offer/accept/:jobSlug/:slug`                                               |
| Authenticated    | `/apply/:slug`, `/my-applications`, `/applications/:id`, `/notifications`                                                                                                                                  |
| Employee         | `/employee/profile`, `/reviews/submit`                                                                                                                                                                     |
| Admin/HR wrapper | `/jobs/create`, `/jobs/edit/:id`, `/dashboard`, `/certificates`, `/offer-letters`, `/admin/reviews`, `/admin/users`, `/admin/employees`, `/admin/recommendations`, `/admin/manage-hr`, `/admin/audit-logs` |

`AdminRoute` does not enforce route-specific permissions; the target must not reproduce that authorization defect.

## Express mount points

Declared in `mern/backend/api/index.js`:

| Mount                  | Router source                    | Domain                                |
| ---------------------- | -------------------------------- | ------------------------------------- |
| `/api/auth`            | `Routes/authRoute.js`            | Auth/current user                     |
| `/api/jobs`            | `Routes/jobRoutes.js`            | Jobs/questions                        |
| `/api/applications`    | `Routes/applicationRoutes.js`    | Applications/resumes/dashboard/offers |
| `/api/certification`   | `Routes/CertificationRoute.js`   | Certificates and offers               |
| `/api/contracts`       | `Routes/contractRoutes.js`       | Acceptance/contracts/documents        |
| `/api/reviews`         | `Routes/reviewRoutes.js`         | Reviews/moderation                    |
| `/api/users`           | `Routes/userRoutes.js`           | People/employee lifecycle             |
| `/api/hr`              | `Routes/hrRoutes.js`             | HR administration                     |
| `/api/recommendations` | `Routes/recommendationRoutes.js` | Referrals/moderation                  |
| `/api/notifications`   | `Routes/notificationRoutes.js`   | Notifications                         |
| `/api/audit`           | `Routes/auditRoutes.js`          | Audit viewer                          |
| `/api/sitemap.xml`     | `Routes/sitemapRoutes.js`        | Dynamic sitemap                       |

Also: `/`, `/api`, and `/api/health` in the server entry. No backend `/api/contact` mount exists.

## Planned Next route mapping

| Existing route class                            | Planned target                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Public pages                                    | App Router Server Components under `(public)` with metadata/loading/error/not-found.                                   |
| Auth forms                                      | `(auth)` pages with Better Auth server endpoints and client form islands.                                              |
| Candidate/employee/admin pages                  | Protected layouts for coarse session checks plus page-level server authorization.                                      |
| Existing HTTP contracts used by UI/integrations | Route Handlers under `src/app/api`; retain method/path/response shape until contract tests approve a versioned change. |
| Internal initial reads                          | Direct server-only domain queries in Server Components where no external HTTP contract is required.                    |
| Interactive mutations                           | Route Handlers or selected Server Actions invoking the same domain services.                                           |
| Sitemap                                         | `src/app/sitemap.ts` or compatible XML handler, preserving approved URLs.                                              |

## Routing risks

- Current wildcard masks 404s by rendering Home.
- IDs and slugs are accepted inconsistently across controllers.
- Public sitemap advertises authenticated `/apply/:slug`.
- Frontend/deployment canonical domains differ (`career-connectsphere` vs `connectsphere`).
- Public offer URLs currently use weak identifiers while generated acceptance tokens are ignored.
- Candidate and recruiter application detail paths are conflated.

No route is `VERIFIED`; runtime characterization and dual-app tests are required.
