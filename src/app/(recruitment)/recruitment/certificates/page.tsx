import { Download } from "lucide-react";

import { requireRecruitment } from "@/lib/auth/authorization";
import { CertificateGenerationModal } from "@/modules/documents/components/certificate-generation-modal";
import { listCertificates } from "@/modules/documents/server/documents";
import { listScopedJobs } from "@/modules/jobs/server/recruitment-jobs";

export default async function CertificatesPage() {
  const actor = await requireRecruitment("canGenerateCertificate");
  const [certificates, jobs] = await Promise.all([
    listCertificates(actor),
    listScopedJobs(actor),
  ]);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Documents</p>
          <h1 className="mt-3 text-4xl font-extrabold">Certificates</h1>
          <p className="mt-2 text-slate-600">
            Issue certificates for jobs in your authorized scope.
          </p>
        </div>
        <CertificateGenerationModal
          jobs={jobs.map(({ id, title, company }) => ({ id, title, company }))}
        />
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="p-4">Recipient</th>
              <th className="p-4">Job / role</th>
              <th className="p-4">Issued</th>
              <th className="p-4">PDF</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-4 font-bold">
                  {item.name}
                  <p className="font-normal text-slate-500">
                    {item.recipientEmail ?? "No email"}
                  </p>
                </td>
                <td className="p-4">
                  {item.job?.title ?? "Legacy unlinked"} · {item.jobrole}
                </td>
                <td className="p-4">
                  {item.issuedOn.toLocaleDateString("en-IN")}
                </td>
                <td className="p-4">
                  <a
                    className="inline-flex items-center gap-2 font-bold text-emerald-700"
                    href={`/api/certificates/${item.id}/download`}
                  >
                    <Download className="size-4" />
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {certificates.length === 0 ? (
          <p className="p-6 text-slate-500">
            No certificates are linked to your assigned jobs.
          </p>
        ) : null}
      </div>
    </>
  );
}
