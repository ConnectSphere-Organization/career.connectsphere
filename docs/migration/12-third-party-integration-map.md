# 12 — Third-Party Integration Map

No secret values are documented.

| Integration             | Source usage                                                                  | Data/side effects                                                                   | Target requirement/risk                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| MongoDB/Mongoose        | `config/database.js`, models/controllers                                      | All business records                                                                | Prisma MongoDB, preserve ObjectIds/collections/fields/indexes; live-data profile first.                                    |
| Cloudinary              | `config/cloudinary.js`, job/application/contract controllers                  | Images, resumes, answers, documents, signed URLs/deletes                            | Separate public media from private PII, magic-byte/MIME/size scan, ownership, cleanup; fix contract mapping.               |
| Nodemailer/Gmail/SMTP   | `services/emailService.js`, several controllers, `config/emailTransporter.js` | OTPs, offers/certificates PDFs, welcome/rejection/contracts/termination/credentials | One adapter/provider, sandbox tests, templates, retries/idempotency/outbox, no plaintext credentials.                      |
| Google reCAPTCHA        | application form + `services/recaptchaService.js`                             | Abuse check token/IP                                                                | Verify hostname/action/score where applicable; add auth/public endpoint abuse controls; test-key isolation.                |
| PDFKit                  | offer/certificate controllers and `pdfService.js`                             | Generated PDFs in memory                                                            | Deterministic server-only renderer, golden fixtures, bounded memory, licensed/valid fonts. Contract PDF currently stubbed. |
| QRCode                  | certificate/offer PDFs                                                        | Verification/acceptance URLs                                                        | Canonical target URLs and secure token semantics.                                                                          |
| pdf-parse / mammoth     | `resumeParserService.js`                                                      | Extracts candidate resume PII                                                       | Resource limits, isolation/background decision, redacted logs, malformed-file tests.                                       |
| Axios                   | frontend `services/api.js`                                                    | JSON/multipart/blob contracts                                                       | Replace internal reads with server calls where appropriate; retain typed compatibility RH; normalize errors.               |
| React Toastify          | global frontend                                                               | User notifications                                                                  | Replace/customize accessible target toaster with message parity.                                                           |
| Framer Motion           | pages/components                                                              | Animations                                                                          | Use Motion only for observed interactions and reduced-motion parity.                                                       |
| React Helmet            | public pages                                                                  | Metadata/canonical/OpenGraph                                                        | Next metadata API, canonical-domain decision.                                                                              |
| Google Fonts            | injected in `main.jsx`                                                        | DM Sans/Outfit                                                                      | `next/font` or approved self-hosting; verify visual metrics/licensing.                                                     |
| Vercel                  | frontend/backend `vercel.json`                                                | SPA rewrites, API proxy, serverless runtime                                         | Define target topology, duration/memory/regions, no unreliable in-memory limiter/background work.                          |
| React CSV / CSV parsing | employee export; backend imports                                              | PII exports and bulk writes                                                         | Robust CSV library, formula-injection mitigation, row/size limits, authorization/audit.                                    |
| date-fns                | document UI                                                                   | Date formatting                                                                     | Preserve locale/time-zone output explicitly.                                                                               |
| Icon libraries          | React Icons, Heroicons, Lucide                                                | Visual icons                                                                        | Consolidate to Lucide where semantically equivalent; snapshot parity.                                                      |

## Present but apparently unused/high-risk dependencies

Backend includes `textract`, OCR/image/AI SDKs, `node-cron`, and other parsing libraries without active source flows. Frontend includes deprecated `react-beautiful-dnd`, `react-shadow` and others without active use. Do not copy unused packages. Verify runtime/lockfile use before removal from the future target.

## Integration-specific parity fixtures

- Fake SMTP inbox with attachment hash/assertions.
- Cloudinary/private storage test double covering upload/sign/delete/failure/orphans.
- reCAPTCHA success/failure/timeout/hostname cases.
- Golden offer/certificate PDFs and QR-decoded URLs.
- Resume fixtures for valid/malformed/oversized PDF/DOCX and extraction failures.
- CSV quoted commas, formula cells, invalid headers, partial rows and large files.
- Mongo read-only profiling and migration rehearsal on sanitized snapshot.
