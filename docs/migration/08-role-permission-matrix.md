# 08 — Role and Permission Matrix

This records source behavior and the security-correct target. HR is not a canonical stored role today; it is inferred inconsistently.

## Identity definitions

| Identity    | Existing frontend                                                  | Existing backend                                                               | Target decision required                                        |
| ----------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Candidate   | role `user`                                                        | role `user`                                                                    | Canonical candidate role.                                       |
| Employee    | role `employee`; status active/former for employee pages           | several middleware variants; recommendation guard also accepts any active user | Require employee role plus approved status policy.              |
| HR          | department `HR` or `General Management/Administration`, and admins | department `HR`/`Human Resources`, legacy role `hr`, and admins                | Canonical capability/role rule; remove department disagreement. |
| Admin       | role `admin`                                                       | role `admin`; bypasses all permissions                                         | Decide documented bypass policy.                                |
| Super-admin | role `super-admin`                                                 | role `super-admin`                                                             | Highest privilege; protect self-lockout/deletion.               |

## Permission fields

`canGenerateCertificate`, `canGenerateOfferLetter`, `canCreateJob`, `canManageJobs`, `canViewApplicants`, `canManageReviews`, `canManageEmployees`, `canManageRecommendations`, `canAccessDashboard`.

## Capability matrix

Legend: ✓ intended allow; P permission; A assigned-job scope; O ownership; — deny. Parenthetical text flags source defects.

| Capability                               |                    Anonymous |                               Candidate |                   Employee |                                                      HR |                      Admin |                Super-admin |
| ---------------------------------------- | ---------------------------: | --------------------------------------: | -------------------------: | ------------------------------------------------------: | -------------------------: | -------------------------: |
| View published jobs/reviews              |                            ✓ |                                       ✓ |                          ✓ |                                                       ✓ |                          ✓ |                          ✓ |
| Apply / own applications                 |                            — |                                     ✓ O | Source direct route allows |                              Source direct route allows | Source direct route allows | Source direct route allows |
| Notifications                            |                            — |                                     ✓ O |                        ✓ O |                                                     ✓ O |                        ✓ O |                        ✓ O |
| Employee profile/review                  |                            — |                                       — |            ✓ active/former |                                                       — |                          — |                          — |
| Recommendations                          |                            — | Backend wrongly allows active candidate |                        ✓ O |                            Depends on employee identity |  Backend middleware allows |                     Allows |
| Dashboard                                |                            — |                                       — |                          — | P `canAccessDashboard` (direct-route/API bypass exists) |                          ✓ |                          ✓ |
| Create job                               |                            — |                                       — |                          — |                                       P create + manage |                          ✓ |                          ✓ |
| Manage job/questions                     |                            — |                                       — |                          — |                                            P manage + A |                          ✓ |                          ✓ |
| View applicants/resumes                  |                            — |                                  O only |                          — |                                              P view + A |                          ✓ |                          ✓ |
| Change application status/reject/welcome |                            — |                                       — |                          — |    P/A intended; assignment missing on source endpoints |                          ✓ |                          ✓ |
| Generate offers                          |                            — |                                       — |                          — |                                          P + A intended |                          ✓ |                          ✓ |
| Certificates                             |       public verify/download |                                       — |                          — |                                 P generate for mutation |                          ✓ |                          ✓ |
| Moderate reviews                         |                            — |                                       — |                          — |                                        P manage reviews |                          ✓ |                          ✓ |
| Manage users/employees                   |                            — |                                       — |                          — |                                      P manage employees |                          ✓ |                          ✓ |
| Manage recommendations                   |                            — |                                       — |                          — |                                                       P |                          ✓ |                          ✓ |
| Manage HR grants                         |                            — |                                       — |                          — |                                                       — |                          — |                          ✓ |
| Change roles/delete users                |                            — |                                       — |                          — |                                                       — |                          — |                          ✓ |
| View audit logs                          |                            — |                                       — |                          — |                                                       — |             Backend denies |                          ✓ |
| Accept/reject own offer                  | Weak public identifier today |                     Token holder target |               Token holder |                                            Token holder |               Token holder |               Token holder |

## Target enforcement rules

1. Every sensitive page performs server authorization; navigation visibility is only UX.
2. Every mutation repeats authorization inside its domain service.
3. Job-scoped HR actions require both capability and assignment.
4. Candidate resources require ownership; public offer actions require one-time token scope.
5. Suspended/inactive accounts are denied; former employee access is explicitly defined per capability.
6. Public verification returns a redacted allowlist.
7. Super-admin-only actions prevent self-delete, unsafe self-demotion and last-super-admin removal.
8. Role, status, permission and assignment changes invalidate/refresh sessions.

## Known source bypasses to test

Broad `AdminRoute`; dashboard permission omission; application detail only `PrivateRoute`; applying as non-candidate via direct route; HR assignment omissions; answer-update IDOR; recommendation employee guard; audit page frontend/back-end mismatch; offer download only requiring authentication; contract actions lacking token. These must become security-correct target differences, documented rather than copied.
