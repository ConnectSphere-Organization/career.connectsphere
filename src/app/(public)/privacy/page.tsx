import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/authorization";
import { PrivacyActions } from "@/modules/privacy/components/privacy-actions";
import { getPrivacyCenter } from "@/modules/privacy/server/privacy";

export default async function PrivacyCenterPage() {
  const session = await requireUser();
  const data = await getPrivacyCenter(session.user.id);
  const deletionPending = data.requests.some(
    (request) =>
      request.type === "DELETION" &&
      ["REQUESTED", "VERIFYING", "IN_PROGRESS"].includes(request.status),
  );
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 pb-28 sm:px-6">
      <p className="section-kicker">Candidate privacy</p>
      <h1 className="mt-3 text-4xl font-extrabold">Your data and choices</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Review consent records, retention timing, download a copy of your
        candidate data, or request deletion. Active employment, fraud
        prevention, and legal obligations may require limited retention.
      </p>
      <div className="mt-8">
        <PrivacyActions deletionPending={deletionPending} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold">Retention</h2>
            <dl className="mt-5 space-y-4">
              <Fact label="Primary email" value={data.profile.primaryEmail} />
              <Fact
                label="Retained until"
                value={
                  data.profile.retentionUntil?.toLocaleDateString("en-IN") ??
                  "Policy review required"
                }
              />
              <Fact
                label="Profile created"
                value={data.profile.createdAt.toLocaleDateString("en-IN")}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold">Consent history</h2>
            <div className="mt-4 space-y-3">
              {data.consents.map((consent) => (
                <article
                  key={consent.id}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <p className="font-bold">
                    {consent.purpose.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Policy {consent.policyVersion} ·{" "}
                    {consent.acceptedAt.toLocaleDateString("en-IN")}
                    {consent.withdrawnAt ? " · withdrawn" : ""}
                  </p>
                </article>
              ))}
              {data.consents.length === 0 ? (
                <p className="text-slate-500">No consent records yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold">Privacy requests</h2>
          <div className="mt-4 space-y-3">
            {data.requests.map((request) => (
              <article
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="font-bold">{request.type}</p>
                  <p className="text-sm text-slate-500">
                    Requested {request.requestedAt.toLocaleDateString("en-IN")}{" "}
                    · due {request.dueAt.toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                  {request.status}
                </span>
              </article>
            ))}
            {data.requests.length === 0 ? (
              <p className="text-slate-500">No privacy requests submitted.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
