import { notFound } from "next/navigation";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/http/api-error";
import { OfferDecisionForm } from "@/modules/documents/components/offer-decision-form";
import { getPublicOfferByToken } from "@/modules/documents/server/documents";

export default async function OfferResponsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let offer;
  try {
    offer = await getPublicOfferByToken(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="section-kicker">Secure offer response</p>
      <h1 className="mt-3 text-4xl font-extrabold">{offer.companyName}</h1>
      <Card className="mt-8">
        <CardContent className="space-y-5 p-7">
          <div>
            <p className="text-sm font-bold text-slate-500">Candidate</p>
            <p className="text-xl font-extrabold">{offer.candidateName}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Position" value={offer.position} />
            <Detail label="Department" value={offer.department} />
            <Detail
              label="Work type"
              value={offer.workType.replace("_", " ")}
            />
            <Detail
              label="Valid until"
              value={offer.validUntil.toLocaleDateString("en-IN")}
            />
          </div>
          {offer.isExpired ? (
            <p className="rounded-xl bg-rose-50 p-4 font-bold text-rose-700">
              This offer link has expired.
            </p>
          ) : offer.status === "ACCEPTED" ? (
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="font-bold text-emerald-800">
                Offer accepted. Complete your contract form to finish
                onboarding.
              </p>
              <Link
                className="mt-3 inline-flex rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white"
                href={`/contract/onboarding/${encodeURIComponent(token)}`}
              >
                Continue contract form
              </Link>
            </div>
          ) : offer.status !== "PENDING" ? (
            <p className="rounded-xl bg-slate-100 p-4 font-bold">
              This offer has already been {offer.status.toLowerCase()}.
            </p>
          ) : (
            <OfferDecisionForm token={token} />
          )}
          <p className="text-xs leading-5 text-slate-500">
            Only decision-safe offer fields are shown here. Email, salary,
            contact details, tokens, and contract data are not exposed by this
            public page.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
