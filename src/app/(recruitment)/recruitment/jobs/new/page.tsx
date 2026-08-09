import { requireRecruitment } from "@/lib/auth/authorization";
import { JobEditorForm } from "@/modules/jobs/components/job-editor-form";
import { emptyJobInput } from "@/modules/jobs/schema";

export default async function NewRecruitmentJobPage() {
  const actor = await requireRecruitment("canCreateJob");
  if (!actor.isAdministrator && !actor.permissions.canManageJobs)
    await requireRecruitment("canManageJobs");
  return (
    <>
      <p className="section-kicker">New opening</p>
      <h1 className="mt-3 text-4xl font-extrabold">Create job</h1>
      <p className="mt-2 text-slate-600">
        Build role details and application questions in one workspace, then save
        as draft or publish immediately.
      </p>
      <JobEditorForm initialValues={emptyJobInput} />
    </>
  );
}
