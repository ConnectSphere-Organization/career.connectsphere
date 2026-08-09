import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/http/api-error";
import { ContractOnboardingForm } from "@/modules/contracts/components/contract-onboarding-form";
import { getContractOnboarding } from "@/modules/contracts/server/contracts";

export default async function ContractOnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let offer;
  try {
    offer = await getContractOnboarding(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <p className="section-kicker">Private onboarding</p>
      <h1 className="mt-3 text-4xl font-extrabold">
        Onboarding form for {offer.candidateName}
      </h1>
      <p className="mt-3 text-slate-600">
        Complete all four steps. Your offer is accepted only after successful
        final submission.
      </p>
      <Card className="mt-8">
        <CardContent className="p-6 sm:p-8">
          <ContractOnboardingForm
            token={token}
            draft={offer.draft}
            draftDocuments={offer.draftDocuments}
            defaults={{
              position: offer.position,
              department: offer.department,
              salary: offer.salary,
              startDate: offer.startDate.toISOString().slice(0, 10),
              joiningLocation: offer.joiningLocation ?? "",
              workType: offer.workType,
              reportingManager: offer.reportingManager ?? "",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
