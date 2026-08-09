import { Plus } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { requireRecruitment } from "@/lib/auth/authorization";
import { listScopedJobs } from "@/modules/jobs/server/recruitment-jobs";

export default async function RecruitmentJobsPage() {
  const actor = await requireRecruitment("canManageJobs");
  const jobs = await listScopedJobs(actor);
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Authorized scope</p>
          <h1 className="mt-3 text-4xl font-extrabold">Jobs</h1>
        </div>
        {actor.isAdministrator || actor.permissions.canCreateJob ? (
          <Link
            href="/recruitment/jobs/new"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
          >
            <Plus className="size-4" />
            New job
          </Link>
        ) : null}
      </div>
      <div className="mt-8 space-y-4">
        {jobs.map((job) => {
          const identifier = job.slug ?? job.id;
          return (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{job.title}</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${job.isPublished === false ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
                    >
                      {job.isPublished === false ? "Draft" : "Published"}
                    </span>
                    {!job.isActive ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold">
                        Closed
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {job.company}
                    {job.department ? ` · ${job.department}` : ""} ·{" "}
                    {job._count.applications} applications
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-bold hover:bg-emerald-50"
                    href={`/recruitment/jobs/${identifier}/edit?tab=applications`}
                  >
                    View applications ({job._count.applications})
                  </Link>
                  <Link
                    className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-bold text-white hover:bg-slate-800"
                    href={`/recruitment/jobs/${identifier}/edit`}
                  >
                    Edit job
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!jobs.length ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              No jobs are assigned to this account.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
