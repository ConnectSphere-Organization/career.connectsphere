import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { requireRecruitment } from "@/lib/auth/authorization";
import { listScopedApplications } from "@/modules/recruitment/server/applications";

export default async function RecruitmentApplicationsPage() {
  const actor = await requireRecruitment("canViewApplicants");
  const applications = await listScopedApplications(actor);
  return (
    <>
      <p className="section-kicker">Candidate pipeline</p>
      <h1 className="mt-3 text-4xl font-extrabold">Applications</h1>
      <p className="mt-2 text-slate-600">
        Only applications for jobs assigned to this account are shown.
      </p>
      <Card className="mt-8 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-5 py-4">Candidate</th>
                  <th className="px-5 py-4">Job</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Applied</th>
                  <th className="px-5 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold">{application.fullName}</p>
                      <p className="text-slate-500">{application.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{application.job.title}</p>
                      <p className="text-slate-500">
                        {application.job.company}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                        {application.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                      }).format(application.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="font-bold text-emerald-700"
                        href={`/recruitment/applications/${application.slug ?? application.id}`}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!applications.length ? (
              <p className="p-12 text-center text-slate-500">
                No applications in scope.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
