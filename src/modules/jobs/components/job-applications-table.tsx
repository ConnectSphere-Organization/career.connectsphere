import Link from "next/link";

export function JobApplicationsTable({
  applications,
}: {
  applications: Array<{
    id: string;
    slug: string | null;
    fullName: string;
    email: string;
    status: string;
    createdAt: Date;
    cloudinaryPublicId: string | null;
  }>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Applications for this job</h2>
          <p className="mt-1 text-sm text-slate-500">
            Open full candidate details or protected resumes.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
          {applications.length} total
        </span>
      </div>
      {applications.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((application) => {
                const identifier = application.slug ?? application.id;
                return (
                  <tr key={application.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-bold">
                      {application.fullName}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {application.email}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">
                        {application.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                      }).format(application.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/recruitment/applications/${identifier}`}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                        >
                          View details
                        </Link>
                        {application.cloudinaryPublicId ? (
                          <a
                            href={`/api/recruitment/applications/${identifier}/resume`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white"
                          >
                            View resume
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          No applications have been submitted for this job yet.
        </div>
      )}
    </section>
  );
}
