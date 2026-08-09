import { BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/authorization";
import { cn } from "@/lib/utils";
import { CandidateOfferActions } from "@/modules/applications/components/candidate-offer-actions";
import { listOwnedApplications } from "@/modules/applications/server/applications";

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  REVIEWING: "bg-blue-100 text-blue-800",
  SHORTLISTED: "bg-violet-100 text-violet-800",
  REJECTED: "bg-rose-100 text-rose-800",
  OFFERED: "bg-emerald-100 text-emerald-800",
  HIRED: "bg-emerald-700 text-white",
};

export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await requireUser();
  const applications = await listOwnedApplications(session.user.id);
  const { submitted } = await searchParams;

  return (
    <div className="bg-slate-50 py-10 pb-28 md:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="section-kicker">Candidate portal</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
          My applications
        </h1>
        <p className="mt-3 text-slate-600">
          Track every application, offer, and latest status.
        </p>

        {submitted === "1" ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">
            Application submitted successfully.
          </p>
        ) : null}

        <div className="mt-8 space-y-5">
          {applications.length ? (
            applications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-950">
                          {application.job.title}
                        </h2>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold",
                            statusStyle[application.status] ??
                              "bg-slate-100 text-slate-700",
                          )}
                        >
                          {application.status
                            .toLowerCase()
                            .replace(/^./, (letter) => letter.toUpperCase())}
                        </span>
                      </div>

                      <p className="mt-2 font-medium text-slate-600">
                        {application.job.company}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        {application.job.location ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-4" />
                            {application.job.location}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-4" />
                          Applied{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                          }).format(application.createdAt)}
                        </span>
                      </div>
                    </div>

                    <Link
                      className={buttonVariants({ variant: "secondary" })}
                      href={`/jobs/${application.job.slug ?? application.job.id}`}
                    >
                      View role
                    </Link>
                  </div>

                  {application.offer ? (
                    <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">
                            Offer letter
                          </p>
                          <h3 className="mt-1 text-xl font-extrabold text-slate-950">
                            {application.offer.position}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {application.offer.department} ·{" "}
                            {application.offer.workType.replaceAll("_", " ")}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800">
                          {application.offer.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
                        <span>
                          Valid until{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                          }).format(application.offer.validUntil)}
                        </span>
                        {application.offer.status === "PENDING" ? (
                          <CandidateOfferActions
                            offerId={application.offer.id}
                          />
                        ) : (
                          <strong>
                            This offer has been{" "}
                            {application.offer.status.toLowerCase()}.
                          </strong>
                        )}
                      </div>
                    </section>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <BriefcaseBusiness className="mx-auto size-14 text-slate-300" />
                <h2 className="mt-5 text-2xl font-bold">No applications yet</h2>
                <p className="mt-2 text-slate-500">
                  Browse open roles and submit your first application.
                </p>
                <Link className={cn(buttonVariants(), "mt-6")} href="/jobs">
                  Browse jobs
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
