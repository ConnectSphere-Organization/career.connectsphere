import { notFound } from "next/navigation";

import { requireRecruitment } from "@/lib/auth/authorization";
import { ApiError } from "@/lib/http/api-error";
import { JobApplicationsTable } from "@/modules/jobs/components/job-applications-table";
import { JobWorkspaceTabs } from "@/modules/jobs/components/job-workspace-tabs";
import { getScopedJob } from "@/modules/jobs/server/recruitment-jobs";
import type { JobInput } from "@/modules/jobs/schema";
import { listJobApplications } from "@/modules/recruitment/server/applications";

export default async function EditRecruitmentJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await requireRecruitment("canManageJobs");
  const { identifier } = await params;
  let job;
  try {
    job = await getScopedJob(identifier, actor);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const applications = await listJobApplications(job.id, actor);
  const requestedTab = (await searchParams).tab;
  const initialTab =
    requestedTab === "questions" || requestedTab === "applications"
      ? requestedTab
      : "details";
  const initialValues: JobInput = {
    title: job.title,
    company: job.company,
    description: job.description,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    location: job.location ?? "",
    type: job.type,
    salary: job.salary ?? "",
    department: job.department ?? "",
    position: job.position ?? "",
    reportingManager: job.reportingManager ?? "",
    requisitionId: job.requisitionId ?? "",
    headcount: job.headcount,
    applicationDeadline:
      job.applicationDeadline?.toISOString().slice(0, 10) ?? "",
    publishAt: job.publishAt?.toISOString().slice(0, 16) ?? "",
    unpublishAt: job.unpublishAt?.toISOString().slice(0, 16) ?? "",
    archived: Boolean(job.archivedAt),
    isActive: job.isActive,
    isPublished: job.isPublished ?? false,
    hrContact: {
      name: job.hrContact?.name ?? "",
      email: job.hrContact?.email ?? "",
      phone: job.hrContact?.phone ?? "",
    },
    questions: job.questions.map((question) => ({
      ...question,
      id: question.id ?? null,
    })),
  };
  return (
    <>
      <p className="section-kicker">Recruitment workspace</p>
      <h1 className="mt-3 text-4xl font-extrabold">Manage job</h1>
      <p className="mt-2 text-slate-600">
        Configure the role, application questions, and review incoming
        candidates.
      </p>
      <JobWorkspaceTabs
        initialValues={initialValues}
        identifier={job.slug ?? job.id}
        imageUrl={job.imageUrl}
        applicationCount={job._count.applications}
        applications={<JobApplicationsTable applications={applications} />}
        initialTab={initialTab}
      />
    </>
  );
}
