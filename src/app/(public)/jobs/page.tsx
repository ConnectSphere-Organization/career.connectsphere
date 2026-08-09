import type { Metadata } from "next";

import { JobListExplorer } from "@/modules/jobs/components/job-list-explorer";
import { searchPublicJobs } from "@/modules/jobs/server/public-jobs";
import { getSession } from "@/lib/auth/authorization";
import { listOwnedApplications } from "@/modules/applications/server/applications";

export const metadata: Metadata = {
  title: "Remote Jobs & Careers",
  description:
    "Browse open roles at ConnectSphere and help build better business conversations.",
  alternates: { canonical: "/jobs" },
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : undefined;
  const query = value("q");
  const department = value("department");
  const location = value("location");
  const type = value("type");
  const resultPromise = searchPublicJobs({
    ...(query ? { query } : {}),
    ...(department ? { department } : {}),
    ...(location ? { location } : {}),
    ...(type ? { type } : {}),
    page: Number(value("page") ?? 1),
  });
  const [result, applications] = await Promise.all([
    resultPromise,
    session ? listOwnedApplications(session.user.id) : Promise.resolve([]),
  ]);
  const applicationStatuses = Object.fromEntries(
    applications.map((application) => [
      application.job.id,
      {
        status: application.status,
        identifier: application.slug ?? application.id,
      },
    ]),
  );
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 pb-24 sm:px-6 md:py-14 lg:px-8">
      <JobListExplorer
        jobs={result.jobs}
        applicationStatuses={applicationStatuses}
        initialSearch={value("q") ?? ""}
        page={result.page}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
