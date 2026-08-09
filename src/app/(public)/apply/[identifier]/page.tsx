import { notFound, redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { getSession, requireUser } from "@/lib/auth/authorization";
import { ApplicationForm } from "@/modules/applications/components/application-form";
import { getOwnedApplicationStatus } from "@/modules/applications/server/applications";
import { getPublicJob } from "@/modules/jobs/server/public-jobs";

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ referral?: string }>;
}) {
  const { identifier } = await params;
  const referralId = (await searchParams).referral ?? "";
  if (!(await getSession())) {
    const destination = `/apply/${encodeURIComponent(identifier)}${referralId ? `?referral=${encodeURIComponent(referralId)}` : ""}`;
    redirect(`/login?redirect=${encodeURIComponent(destination)}`);
  }
  const session = await requireUser();
  const job = await getPublicJob(identifier);
  if (!job) notFound();
  const status = await getOwnedApplicationStatus(identifier, session.user.id);

  return (
    <div className="bg-slate-50 py-10 pb-28 md:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-7">
          <p className="section-kicker">Candidate application</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
            Apply with confidence
          </h1>
          <p className="mt-3 text-slate-600">
            Your documents are uploaded privately and your application is linked
            to your signed-in account.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 md:p-9">
            <ApplicationForm
              job={job}
              candidate={{
                name: session.user.name,
                email: session.user.email,
                phoneNumber: session.user.phoneNumber,
              }}
              hasApplied={status.hasApplied}
              referralId={referralId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
