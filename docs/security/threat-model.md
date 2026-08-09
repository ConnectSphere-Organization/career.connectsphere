# Threat model

## Protected assets

- Candidate identity, resumes, interview feedback, offers, contracts, employee records, bank/payroll data, and controlled documents.
- Authentication sessions, reset/verification links, signing secrets, encryption keys, SMTP and storage credentials.
- Hiring decisions, payroll approvals, exit clearance, audit history, and webhook delivery integrity.

## Trust boundaries

Browser → Next.js/WAF → authorization policy → MongoDB/private object storage → outbox worker → email, calendar, HRIS and webhook providers.

## Primary threats and controls

| Threat                                    | Required control                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Broken object-level authorization         | Capability and assigned-job checks in route and service layers; negative policy tests.                                 |
| Session theft/fixation                    | HTTP-only secure same-site cookies, session expiry, session revocation on access changes, admin MFA before production. |
| Sensitive-data disclosure                 | Explicit Prisma projections, private signed downloads, encryption at rest for bank/config secrets, redacted logs.      |
| Malicious uploads                         | Size/type/signature validation, private quarantine, production malware scanner, release only after clean verdict.      |
| Injection/XSS                             | Zod validation, React escaping, restrictive CSP, no HTML templates from untrusted users.                               |
| CSRF/CORS                                 | Same-site cookies, origin validation for mutating APIs, trusted-origin configuration.                                  |
| Webhook forgery/replay                    | Per-endpoint HMAC secret, timestamped signature, idempotent event ID, TLS, bounded retries and DLQ.                    |
| Payroll fraud                             | HR/finance separation of duties, approval and lock states, immutable audit events, reconciliation.                     |
| Privacy over-retention                    | Versioned consent, retention dates, export/deletion workflows, dry-run/apply purge worker.                             |
| Availability failure hidden as empty data | Public and admin queries propagate operational errors to route error boundaries.                                       |

## Production gates

Admin MFA/SSO, external malware scanning, distributed rate limiting, key rotation rehearsal, provider sandbox tests, backup/restore rehearsal, dependency/secret scanning, and penetration testing remain mandatory deployment controls.
