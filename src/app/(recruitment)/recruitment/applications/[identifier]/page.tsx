import {
  ArrowLeft,
  BriefcaseBusiness,
  FileText,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { requireRecruitment } from "@/lib/auth/authorization";
import { ApiError } from "@/lib/http/api-error";
import { CertificateGenerationModal } from "@/modules/documents/components/certificate-generation-modal";
import { OfferActions } from "@/modules/documents/components/offer-actions";
import { ApplicationActions } from "@/modules/recruitment/applications/components/application-actions";
import { CandidateCollaboration } from "@/modules/recruitment/applications/components/candidate-collaboration";
import {
  ContractSummary,
  Fact,
  JobInformation,
  OfferSummary,
  ScreeningAnswers,
} from "@/modules/recruitment/applications/components/application-detail-sections";
import {
  allowedStatusTransitions,
  getScopedApplication,
} from "@/modules/recruitment/server/applications";

export default async function RecruitmentApplicationPage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const actor = await requireRecruitment("canViewApplicants");
  const { identifier } = await params;

  let application;
  try {
    application = await getScopedApplication(identifier, actor);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const applicationIdentifier = application.slug ?? application.id;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() + 30);
  const validUntil = new Date(today);
  validUntil.setUTCDate(validUntil.getUTCDate() + 14);
  const dateInput = (value: Date) => value.toISOString().slice(0, 10);
  const certificateDate = dateInput(
    application.contract?.employmentDetails?.startDate ?? today,
  );

  return (
    <div className="pb-16">
      <nav
        className="mb-6 flex flex-wrap gap-4 text-sm font-bold"
        aria-label="Breadcrumb"
      >
        <Link
          className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-700"
          href="/recruitment/applications"
        >
          <ArrowLeft className="size-4" />
          Applications
        </Link>
        <Link
          className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-700"
          href={`/recruitment/jobs/${application.job.slug ?? application.job.id}/edit`}
        >
          <BriefcaseBusiness className="size-4" />
          Job detail
        </Link>
      </nav>

      <header className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold tracking-[0.24em] text-emerald-300 uppercase">
              Application review
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {application.fullName}
            </h1>
            <p className="mt-3 text-lg text-slate-300">
              {application.job.title} · {application.job.company}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <Mail className="size-4" />
                {application.email}
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone className="size-4" />
                {application.phone}
              </span>
              {application.job.location ? (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4" />
                  {application.job.location}
                </span>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 text-right">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Current status
            </p>
            <p className="mt-1 text-xl font-black">{application.status}</p>
            <p className="mt-1 text-sm text-slate-300">
              Applied {formatDateTime(application.createdAt)}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                    Applicant
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">
                    Contact & profile
                  </h2>
                </div>
                {application.resumeAvailable ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                    href={`/api/recruitment/applications/${encodeURIComponent(applicationIdentifier)}/resume`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="size-4" />
                    Open protected resume
                  </a>
                ) : null}
              </div>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <Fact label="Full name" value={application.fullName} />
                <Fact label="Email" value={application.email} />
                <Fact label="Phone" value={application.phone} />
                <Fact
                  label="Applied at"
                  value={formatDateTime(application.createdAt)}
                />
              </dl>
            </CardContent>
          </Card>

          <JobInformation job={application.job} />

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-extrabold">Candidate profile</h2>
              <dl className="mt-5 space-y-6">
                <Fact label="Experience" value={application.experience} />
                <Fact label="Education" value={application.education} />
                <Fact label="Skills" value={application.skills.join(" · ")} />
                <Fact label="Cover letter" value={application.coverLetter} />
              </dl>
            </CardContent>
          </Card>

          {application.questionAnswers.length ? (
            <ScreeningAnswers
              answers={application.questionAnswers}
              identifier={applicationIdentifier}
            />
          ) : null}
          {application.offer ? (
            <OfferSummary offer={application.offer} />
          ) : null}
          {application.contract ? (
            <ContractSummary contract={application.contract} />
          ) : application.offer ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-xs font-bold tracking-widest text-amber-700 uppercase">
                  Acceptance & contract
                </p>
                <h2 className="mt-1 text-2xl font-extrabold">
                  {application.offer.status === "ACCEPTED"
                    ? "Waiting for onboarding submission"
                    : "Waiting for offer acceptance"}
                </h2>
                <p className="mt-2 text-slate-600">
                  A contract summary appears here only after the candidate
                  completes the protected onboarding flow.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <CandidateCollaboration
            identifier={applicationIdentifier}
            actorId={actor.id}
          />
        </main>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <ApplicationActions
            identifier={applicationIdentifier}
            currentStatus={application.status}
            allowedTransitions={allowedStatusTransitions(application.status)}
            offerStatus={application.offer?.status ?? null}
            hasContract={Boolean(application.contract)}
            csv={{
              fullName: application.fullName,
              email: application.email,
              phone: application.phone,
              skills: application.skills,
              experience: application.experience,
              education: application.education,
              coverLetter: application.coverLetter,
              status: application.status,
              createdAt: application.createdAt,
              jobTitle: application.job.title,
            }}
            {...(!application.offer &&
            (actor.permissions.canGenerateOfferLetter || actor.isAdministrator)
              ? {
                  offer: {
                    applicationId: applicationIdentifier,
                    initialValues: {
                      candidateName: application.fullName,
                      email: application.email,
                      position:
                        application.job.position || application.job.title,
                      department: application.job.department || "General",
                      salary: application.job.salary || "",
                      offerType:
                        application.job.type === "INTERNSHIP"
                          ? "INTERNSHIP"
                          : "JOB",
                      startDate: dateInput(startDate),
                      validUntil: dateInput(validUntil),
                      joiningLocation: application.job.location || "",
                      reportingManager: application.job.reportingManager || "",
                      hrContactName:
                        application.job.hrContact?.name || actor.name,
                      hrContactEmail:
                        application.job.hrContact?.email || actor.email,
                      hrContactPhone: application.job.hrContact?.phone || "",
                    },
                  },
                }
              : {})}
          />

          {application.offer ? (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  Offer tools
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  Manage offer letter
                </p>
                <div className="mt-4">
                  <OfferActions
                    id={application.offer.id}
                    status={application.offer.status}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {application.contract &&
          (actor.permissions.canGenerateCertificate ||
            actor.isAdministrator) ? (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  Certificate
                </p>
                <p className="mt-1 text-lg font-extrabold">Issue certificate</p>
                <p className="mt-2 text-sm text-slate-600">
                  Individual values are prefilled; bulk import is also
                  available.
                </p>
                <div className="mt-4">
                  <CertificateGenerationModal
                    fullWidth
                    jobs={[
                      {
                        id: application.job.id,
                        title: application.job.title,
                        company: application.job.company,
                      },
                    ]}
                    initialValues={{
                      jobId: application.job.id,
                      name: application.fullName,
                      recipientEmail: application.email,
                      domain:
                        application.contract.employmentDetails?.department ??
                        application.job.department ??
                        application.job.title,
                      jobrole:
                        application.contract.employmentDetails?.position ??
                        application.job.position ??
                        application.job.title,
                      fromDate: certificateDate,
                      toDate: certificateDate,
                      issuedBy: actor.name || "ConnectSphere",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
