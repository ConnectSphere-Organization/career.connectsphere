import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  IndianRupee,
  MapPin,
  UserRound,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicJob } from "@/modules/jobs/server/public-jobs";
import { formatSalary } from "@/modules/jobs/utils";
import { getSession } from "@/lib/auth/authorization";
import { getOwnedApplicationStatus } from "@/modules/applications/server/applications";
import { SaveJobButton } from "@/modules/jobs/components/save-job-button";

type JobDetailPageProps = { params: Promise<{ identifier: string }> };

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { identifier } = await params;
  const job = await getPublicJob(identifier);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.company}`,
    description: job.description.slice(0, 155),
    alternates: { canonical: `/jobs/${job.slug ?? job.id}` },
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { identifier } = await params;
  const job = await getPublicJob(identifier);
  if (!job) notFound();
  const session = await getSession();
  const applicationStatus = session
    ? await getOwnedApplicationStatus(identifier, session.user.id)
    : null;
  const canonicalUrl = new URL(
    `/jobs/${job.slug ?? job.id}`,
    process.env.APP_URL ?? "http://localhost:3001",
  ).toString();
  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: (job.publishAt ?? job.createdAt).toISOString(),
    ...(job.applicationDeadline
      ? { validThrough: job.applicationDeadline.toISOString() }
      : {}),
    ...(job.type
      ? { employmentType: job.type.replaceAll("-", "_").toUpperCase() }
      : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: process.env.APP_URL ?? "http://localhost:3001",
    },
    ...(job.location
      ? {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location,
            },
          },
        }
      : {}),
    identifier: {
      "@type": "PropertyValue",
      name: job.company,
      value: job.requisitionId ?? job.id,
    },
    url: canonicalUrl,
    totalJobOpenings: job.headcount,
  };

  return (
    <div className="bg-slate-50 py-10 pb-28 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jobPosting).replaceAll("<", "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to jobs
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 shadow-sm md:p-10">
          <div className="absolute top-0 right-0 size-72 rounded-full bg-blue-50 blur-3xl" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-start">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              {job.imageUrl ? (
                <Image
                  src={job.imageUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="size-full object-cover"
                  priority
                />
              ) : (
                <BriefcaseBusiness
                  className="size-10 text-blue-600"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="section-kicker">Open role</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
                {job.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-slate-600">
                <span className="flex items-center gap-2">
                  <Building2
                    className="size-5 text-blue-600"
                    aria-hidden="true"
                  />
                  {job.company}
                </span>
                {job.location ? (
                  <span className="flex items-center gap-2">
                    <MapPin
                      className="size-5 text-blue-600"
                      aria-hidden="true"
                    />
                    {job.location}
                  </span>
                ) : null}
                {job.type ? (
                  <span className="flex items-center gap-2">
                    <BriefcaseBusiness
                      className="size-5 text-blue-600"
                      aria-hidden="true"
                    />
                    {job.type}
                  </span>
                ) : null}
                {job.salary ? (
                  <span className="flex items-center gap-2 font-semibold text-blue-700">
                    <IndianRupee className="size-5" aria-hidden="true" />
                    {formatSalary(job.salary)?.replace(/^₹/, "")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {session ? <SaveJobButton jobId={job.id} /> : null}
              {applicationStatus?.hasApplied ? (
                <div className="text-right">
                  <span className="block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Application:{" "}
                    {applicationStatus.application.status.replaceAll("_", " ")}
                  </span>
                  <Link
                    href="/my-applications"
                    className={`${buttonVariants({ size: "lg" })} mt-3`}
                  >
                    View application
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/apply/${job.slug ?? job.id}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  Apply now
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <main className="space-y-8">
            <ContentSection title="About the role">
              <p className="leading-8 whitespace-pre-line text-slate-600">
                {job.description}
              </p>
            </ContentSection>
            {job.requirements.length ? (
              <ContentSection title="What we're looking for">
                <BulletList items={job.requirements} />
              </ContentSection>
            ) : null}
            {job.responsibilities.length ? (
              <ContentSection title="What you'll do">
                <BulletList items={job.responsibilities} />
              </ContentSection>
            ) : null}
          </main>

          <aside className="space-y-5">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-slate-950">
                  Role overview
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
                  {job.department ? (
                    <Detail label="Department" value={job.department} />
                  ) : null}
                  {job.position ? (
                    <Detail label="Position" value={job.position} />
                  ) : null}
                  {job.reportingManager ? (
                    <Detail label="Reports to" value={job.reportingManager} />
                  ) : null}
                  <Detail
                    label="Posted"
                    value={new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                    }).format(job.createdAt)}
                  />
                </dl>
              </CardContent>
            </Card>
            {job.hrContact ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <UserRound className="size-5" />
                    </span>
                    <div>
                      <h2 className="font-bold text-slate-950">
                        Recruitment contact
                      </h2>
                      <p className="text-sm text-slate-500">
                        Questions about this role
                      </p>
                    </div>
                  </div>
                  {job.hrContact.name ? (
                    <p className="mt-5 font-semibold text-slate-800">
                      {job.hrContact.name}
                    </p>
                  ) : null}
                  {job.hrContact.email ? (
                    <a
                      className="mt-1 block text-sm break-all text-blue-700 hover:underline"
                      href={`mailto:${job.hrContact.email}`}
                    >
                      {job.hrContact.email}
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ContentSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardContent className="p-7 md:p-8">
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <div className="mt-5">{children}</div>
      </CardContent>
    </Card>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-7 text-slate-600">
          <CheckCircle2
            className="mt-1 size-5 shrink-0 text-blue-600"
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
