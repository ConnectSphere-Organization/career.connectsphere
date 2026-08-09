import { Download, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OfferActions } from "@/modules/documents/components/offer-actions";
import { formatApplicationAnswer } from "@/modules/recruitment/applications/detail-utils";

type Answer = {
  id: string | null;
  questionText: string | null;
  questionType: string | null;
  answer: unknown;
  hasFile: boolean;
};

export function JobInformation({
  job,
}: {
  job: {
    title: string;
    company: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    questions: Array<{
      id: string | null;
      questionText: string;
      questionType: string;
      required: boolean;
    }>;
    department: string | null;
    location: string | null;
    type: string | null;
    salary: string | null;
  };
}) {
  return (
    <Card>
      <details open>
        <summary className="cursor-pointer list-none rounded-t-3xl px-6 py-5 marker:hidden focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                Role context
              </p>
              <h2 className="mt-1 text-2xl font-extrabold">
                Complete job information
              </h2>
            </div>
            <span className="text-sm font-bold text-slate-500">
              Expand / collapse
            </span>
          </div>
        </summary>
        <CardContent className="space-y-6 p-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Company" value={job.company} />
            <Fact label="Department" value={job.department} />
            <Fact label="Location" value={job.location} />
            <Fact label="Type" value={job.type?.replaceAll("_", " ")} />
          </div>
          {job.salary ? (
            <Fact label="Published compensation" value={job.salary} />
          ) : null}
          <Section title="Description">
            <p className="leading-7 whitespace-pre-wrap text-slate-700">
              {job.description}
            </p>
          </Section>
          <StringList title="Requirements" items={job.requirements} />
          <StringList title="Responsibilities" items={job.responsibilities} />
          {job.questions.length ? (
            <Section title="Screening questions">
              <ol className="space-y-3">
                {job.questions.map((question, index) => (
                  <li
                    key={question.id ?? index}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <span className="font-bold">
                      {index + 1}. {question.questionText}
                    </span>
                    <span className="ml-2 text-xs font-bold text-slate-500">
                      {question.questionType.replaceAll("_", " ")}
                      {question.required ? " · required" : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}
        </CardContent>
      </details>
    </Card>
  );
}

export function ScreeningAnswers({
  answers,
  identifier,
}: {
  answers: readonly Answer[];
  identifier: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-extrabold">Screening answers</h2>
        <div className="mt-5 divide-y divide-slate-100">
          {answers.map((answer, index) => {
            const formatted = formatApplicationAnswer(answer.answer);
            return (
              <article
                className="py-5 first:pt-0 last:pb-0"
                key={answer.id ?? index}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-bold">
                    {answer.questionText || `Question ${index + 1}`}
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                    {answer.questionType?.replaceAll("_", " ") || "answer"}
                  </span>
                </div>
                {formatted.items.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {formatted.items.map((item) => (
                      <li
                        className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800"
                        key={item}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className={`mt-3 leading-7 whitespace-pre-wrap ${formatted.isEmpty ? "text-slate-400 italic" : "text-slate-700"}`}
                  >
                    {formatted.text}
                  </p>
                )}
                {answer.hasFile && answer.id ? (
                  <a
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"
                    href={`/api/recruitment/applications/${encodeURIComponent(identifier)}/answers/${encodeURIComponent(answer.id)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="size-4" />
                    Open protected attachment
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

type Offer = {
  id: string;
  shortId: string | null;
  status: string;
  acceptedAt: Date | null;
  position: string;
  department: string;
  salary: string;
  payoutFrequency: string | null;
  startDate: Date;
  endDate: Date | null;
  duration: string | null;
  validUntil: Date;
  workType: string;
  joiningLocation: string | null;
  issuedOn: Date;
};

export function OfferSummary({ offer }: { offer: Offer }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
              Offer
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">
              {offer.shortId ?? "Offer letter"}
            </h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">
            {offer.status}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Fact label="Position" value={offer.position} />
          <Fact label="Department" value={offer.department} />
          <Fact
            label="Compensation"
            value={`${offer.salary}${offer.payoutFrequency ? ` · ${offer.payoutFrequency}` : ""}`}
          />
          <Fact label="Start date" value={formatDate(offer.startDate)} />
          <Fact
            label="Duration"
            value={
              offer.duration ??
              (offer.endDate ? `Until ${formatDate(offer.endDate)}` : null)
            }
          />
          <Fact label="Valid until" value={formatDate(offer.validUntil)} />
          <Fact label="Work type" value={offer.workType.replaceAll("_", " ")} />
          <Fact
            label="Accepted"
            value={
              offer.acceptedAt
                ? formatDateTime(offer.acceptedAt)
                : "Not accepted"
            }
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <a href={`/api/recruitment/offers/${offer.id}/download`}>
              <Download className="size-4" />
              Download PDF
            </a>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/recruitment/offers">
              <ExternalLink className="size-4" />
              All offers
            </Link>
          </Button>
          <OfferActions id={offer.id} status={offer.status} />
        </div>
      </CardContent>
    </Card>
  );
}

type Contract = {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  acceptedAt: Date;
  acceptanceComments: string | null;
  adminComments: string | null;
  workflowStatus: {
    currentStage: string | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
  } | null;
  personalInfo: {
    dateOfBirth: Date | null;
    nationality: string | null;
    address: {
      street: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
      country: string | null;
    } | null;
    emergencyContact: {
      name: string | null;
      relationship: string | null;
      phone: string | null;
      email: string | null;
    } | null;
    identification: { idType: string | null; idNumber: string | null } | null;
  } | null;
  bankingInfo: {
    accountHolderName: string | null;
    accountNumber: string | null;
    bankName: string | null;
    ifscCode: string | null;
    accountType: string | null;
    branch: string | null;
  } | null;
  documents: Array<{
    id: string | null;
    documentType: string | null;
    fileName: string | null;
  }>;
};

export function ContractSummary({ contract }: { contract: Contract }) {
  const address = contract.personalInfo?.address;
  const emergency = contract.personalInfo?.emergencyContact;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest text-amber-700 uppercase">
              Acceptance & onboarding
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">
              Redacted contract summary
            </h2>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
            {contract.status.replaceAll("_", " ")}
          </span>
        </div>

        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Identity, account, and routing values remain masked. Private documents
          use authorized application routes only.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Fact
            label="Contact"
            value={[contract.email, contract.phone].filter(Boolean).join(" · ")}
          />
          <Fact label="Accepted" value={formatDateTime(contract.acceptedAt)} />
          <Fact
            label="Address"
            value={
              address
                ? [
                    address.street,
                    address.city,
                    address.state,
                    address.zipCode,
                    address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : null
            }
          />
          <Fact
            label="Emergency contact"
            value={
              emergency
                ? [
                    emergency.name,
                    emergency.relationship,
                    emergency.phone,
                    emergency.email,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : null
            }
          />
          <Fact
            label="Banking"
            value={
              contract.bankingInfo
                ? [
                    contract.bankingInfo.accountHolderName,
                    contract.bankingInfo.bankName,
                    contract.bankingInfo.accountNumber,
                    contract.bankingInfo.ifscCode,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : null
            }
          />
          <Fact
            label="Identification"
            value={
              contract.personalInfo?.identification
                ? [
                    contract.personalInfo.identification.idType,
                    contract.personalInfo.identification.idNumber,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : null
            }
          />
          <Fact
            label="Workflow"
            value={contract.workflowStatus?.currentStage?.replaceAll("_", " ")}
          />
          <Fact
            label="Submitted / reviewed"
            value={[
              contract.workflowStatus?.submittedAt
                ? formatDateTime(contract.workflowStatus.submittedAt)
                : null,
              contract.workflowStatus?.reviewedAt
                ? formatDateTime(contract.workflowStatus.reviewedAt)
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-amber-700 uppercase">
                Protected documents
              </p>
              <h3 className="mt-1 text-lg font-extrabold">Download files</h3>
            </div>
            <a
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              href={`/recruitment/contracts/${contract.id}`}
            >
              <ExternalLink className="size-4" />
              Open contract review
            </a>
          </div>

          <ul className="mt-4 divide-y divide-amber-100">
            {contract.documents.length ? (
              contract.documents.map((document) =>
                document.id ? (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                    key={document.id}
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {document.fileName ??
                          document.documentType ??
                          "Document"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {document.documentType?.replaceAll("_", " ") ??
                          "Document"}
                      </p>
                    </div>
                    <a
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-3 py-2 text-sm font-bold text-amber-800 hover:bg-amber-50"
                      href={`/api/recruitment/contracts/${contract.id}/documents/${document.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="size-4" />
                      Download
                    </a>
                  </li>
                ) : null,
              )
            ) : (
              <li className="py-3 text-sm text-slate-500">
                No private documents available.
              </li>
            )}
          </ul>
        </div>

        {contract.acceptanceComments ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            Candidate note: {contract.acceptanceComments}
          </p>
        ) : null}
        {contract.adminComments ? (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Admin note: {contract.adminComments}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function Fact({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-semibold whitespace-pre-wrap text-slate-800">
        {value || "—"}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-extrabold">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function StringList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return items.length ? (
    <Section title={title}>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex gap-3 text-slate-700">
            <span className="text-emerald-600">●</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  ) : null;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(value);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
