import Link from "next/link";

import { requireRecruitment } from "@/lib/auth/authorization";
import { listContracts } from "@/modules/contracts/server/contracts";

export default async function ContractsPage() {
  const actor = await requireRecruitment("canViewApplicants");
  const contracts = await listContracts(actor);
  return (
    <>
      <p className="section-kicker">Protected documents</p>
      <h1 className="mt-3 text-4xl font-extrabold">Employment contracts</h1>
      <p className="mt-2 text-slate-600">
        Sensitive fields are masked by default. No reveal action or API is
        available.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="p-4">Candidate</th>
              <th className="p-4">Position</th>
              <th className="p-4">Status</th>
              <th className="p-4">Submitted</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-4">
                  <p className="font-bold">{item.candidateName}</p>
                  <p className="text-xs text-slate-500">{item.email}</p>
                </td>
                <td className="p-4">
                  {item.employmentDetails?.position ?? "—"}
                </td>
                <td className="p-4">{item.status.replaceAll("_", " ")}</td>
                <td className="p-4">
                  {item.createdAt.toLocaleDateString("en-IN")}
                </td>
                <td className="p-4">
                  <Link
                    className="font-bold text-emerald-700"
                    href={`/recruitment/contracts/${item.id}`}
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contracts.length === 0 ? (
          <p className="p-6 text-slate-500">No submitted contracts.</p>
        ) : null}
      </div>
    </>
  );
}
