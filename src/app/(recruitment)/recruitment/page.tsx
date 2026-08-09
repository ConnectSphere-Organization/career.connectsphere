import {
  BriefcaseBusiness,
  ClipboardCheck,
  Clock3,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { requireRecruitmentActor } from "@/lib/auth/authorization";
import { recruitmentHome } from "@/lib/auth/recruitment-home";
import { getRecruitmentDashboard } from "@/modules/recruitment/server/dashboard";

export default async function RecruitmentDashboardPage() {
  const actor = await requireRecruitmentActor();
  if (!actor.isAdministrator && !actor.permissions.canAccessDashboard)
    redirect(recruitmentHome(actor) ?? "/");
  const { stats, recent } = await getRecruitmentDashboard(actor);
  const cards = [
    {
      label: "Applications",
      value: stats.total,
      icon: ClipboardCheck,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Awaiting review",
      value: stats.pending + stats.reviewing,
      icon: Clock3,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Advanced",
      value: stats.shortlisted + stats.offered + stats.hired,
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Active jobs",
      value: stats.activeJobs,
      icon: BriefcaseBusiness,
      color: "text-violet-600 bg-violet-50",
    },
  ];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Secure overview</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
            Recruitment dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Welcome, {actor.name}. Figures reflect only jobs in your authorized
            scope.
          </p>
        </div>
        {actor.isAdministrator ||
        (actor.permissions.canCreateJob && actor.permissions.canManageJobs) ? (
          <Link
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            href="/recruitment/jobs/new"
          >
            Create job
          </Link>
        ) : null}
      </div>
      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-4xl font-extrabold">{value}</p>
              </div>
              <span className={`rounded-2xl p-3 ${color}`}>
                <Icon className="size-6" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent applications</h2>
              <Link
                className="text-sm font-bold text-emerald-700"
                href="/recruitment/applications"
              >
                View all
              </Link>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {recent.length ? (
                recent.map((application) => (
                  <Link
                    key={application.id}
                    href={`/recruitment/applications/${application.slug ?? application.id}`}
                    className="flex items-center justify-between gap-4 py-4 hover:text-emerald-700"
                  >
                    <div>
                      <p className="font-bold">{application.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {application.job.title}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                      {application.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="py-10 text-center text-slate-500">
                  No applications in scope.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold">Status breakdown</h2>
            <dl className="mt-5 space-y-4">
              {Object.entries({
                Pending: stats.pending,
                Reviewing: stats.reviewing,
                Shortlisted: stats.shortlisted,
                Offered: stats.offered,
                Hired: stats.hired,
                Rejected: stats.rejected,
              }).map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-slate-100 pb-3"
                >
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
