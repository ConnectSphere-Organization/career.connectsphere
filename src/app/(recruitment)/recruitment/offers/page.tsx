import { Download } from "lucide-react";

import { requireRecruitment } from "@/lib/auth/authorization";
import { OfferGenerationModal } from "@/modules/documents/components/offer-generation-modal";
import { OfferActions } from "@/modules/documents/components/offer-actions";
import { listOffers } from "@/modules/documents/server/documents";

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ application?: string }>;
}) {
  const actor = await requireRecruitment("canGenerateOfferLetter");
  const { application = "" } = await searchParams;
  const offers = await listOffers(actor);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Documents</p>
          <h1 className="mt-3 text-4xl font-extrabold">Offer letters</h1>
          <p className="mt-2 text-slate-600">
            Issue, deliver, extend, and securely manage candidate offers.
          </p>
        </div>
        <OfferGenerationModal applicationId={application} />
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-5xl text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Candidate</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">History</th>
              <th className="p-4">PDF</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="p-4 font-mono text-xs">
                  {item.shortId ?? item.id}
                </td>
                <td className="p-4 font-bold">
                  {item.candidateName}
                  <p className="font-normal text-slate-500">{item.email}</p>
                </td>
                <td className="p-4">
                  {item.position} · {item.department}
                </td>
                <td className="p-4">{item.status}</td>
                <td className="p-4">
                  {item.extensionHistory.length} extension(s)
                </td>
                <td className="p-4">
                  <a
                    className="inline-flex items-center gap-2 font-bold text-emerald-700"
                    href={`/api/recruitment/offers/${item.id}/download`}
                  >
                    <Download className="size-4" />
                    Download
                  </a>
                </td>
                <td className="p-4">
                  <OfferActions id={item.id} status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {offers.length === 0 ? (
          <p className="p-6 text-slate-500">No offers issued.</p>
        ) : null}
      </div>
    </>
  );
}
